// トップページヒーローの WGSL シェーダー(vgpu 用)
// コンセプト: node_modules の積層。等角投影の 5 枚のレイヤーが静かに呼吸し、
// 数秒おきに光沢(グリント)が斜めに走り、マウスに視差追従する。
// ラベル文字は DOM 側で重ねる(シェーダーには文字を描かない)。
export const STACK_WGSL = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f,
  paper: vec4f,
  plane: vec4f,
  shadow: vec4f,
  edge: vec4f,
  glint: vec4f,
}
@group(0) @binding(0) var<uniform> params: Params;

// 2:1 の等角ダイヤモンド(擬似 SDF)。負が内側。
fn diamond(p: vec2f, c: vec2f, w: f32, h: f32) -> f32 {
  let q = abs(p - c);
  return q.x / w + q.y / h - 1.0;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = vec2f(uv.x * params.aspect, uv.y);
  var col = params.paper.rgb;
  let cx = params.aspect * 0.5;
  let w = 0.36;
  let h = 0.175;
  let dir = normalize(vec2f(2.0, 1.0));

  for (var i = 0; i < 5; i++) {
    let fi = f32(i);
    let depth = fi - 2.0;
    // 呼吸: 各層が位相をずらして上下に 数px 揺れる
    let bob = sin(params.time * 0.55 + fi * 1.15) * 0.006;
    let c = vec2f(
      cx + params.pointer.x * depth * 0.016,
      0.815 - fi * 0.138 + bob + params.pointer.y * depth * 0.011
    );

    // ひとつ下の面に落ちる柔らかい影(面の直下にタイトに)
    let ds = diamond(p, c + vec2f(0.0, 0.032), w * 0.96, h * 0.96);
    let sh = (1.0 - smoothstep(-0.12, 0.18, ds)) * 0.13;
    col = mix(col, params.shadow.rgb, sh);

    // 面の塗り(上の層ほどわずかに明るい紙)
    let d = diamond(p, c, w, h);
    let mask = 1.0 - smoothstep(-0.006, 0.006, d);
    var fill = mix(params.plane.rgb, params.glint.rgb, fi * 0.045);
    // 面内の淡い異方性シェーディング(奥がわずかに沈む)
    fill -= vec3f((p.y - c.y) / h * 0.014);

    // グリント: 約 7 秒周期で斜めに走る細い光沢。層ごとに少し遅れて連鎖する
    let phase = fract(params.time / 7.0 - fi * 0.045);
    let sp = mix(-1.4, 1.4, phase);
    let proj = dot(p - c, dir) / (w * 0.9);
    let g = exp(-pow((proj - sp) * 13.0, 2.0));
    fill += params.glint.rgb * g * 0.38;

    col = mix(col, fill, mask * 0.97);

    // ヘアラインエッジ
    let edgeLine = 1.0 - smoothstep(0.003, 0.011, abs(d));
    col = mix(col, params.edge.rgb, edgeLine * 0.45);
  }

  return vec4f(col, 1.0);
}
`;

// レイヤーの層数・位置は shader と LayerStack.vue(DOM ラベル)で共有する
export const LAYER_COUNT = 5;
export const layerCenterY = (i) => 0.815 - i * 0.138;
export const layerBob = (t, i) => Math.sin(t * 0.55 + i * 1.15) * 0.006;

// design.md のトークンに対応するシェーダーパレット(sRGB 0..1)
export const PALETTES = {
  light: {
    paper: [0.957, 0.949, 0.925, 1],
    plane: [0.988, 0.984, 0.972, 1],
    shadow: [0.55, 0.62, 0.56, 1],
    edge: [0.72, 0.77, 0.72, 1],
    glint: [1.0, 1.0, 0.995, 1],
  },
  dark: {
    paper: [0.083, 0.13, 0.104, 1],
    plane: [0.135, 0.195, 0.158, 1],
    shadow: [0.03, 0.055, 0.04, 1],
    edge: [0.3, 0.4, 0.34, 1],
    glint: [0.62, 0.8, 0.68, 1],
  },
};
