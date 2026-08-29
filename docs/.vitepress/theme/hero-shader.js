// トップページヒーロー背面の「依存グラフ星座」(vgpu / WebGPU 用 WGSL)。
// 画面右上から淡く広がるネットワーク。ノードはゆっくり漂い、
// エッジは同じノード座標から毎フレーム導出するため、線と点は決して離れない。
// 座標系: 右端を x=0 とし左へ負(q = uv.x*aspect - aspect)。y は 0(上)〜1(下)。
export const NETWORK_WGSL = /* wgsl */ `
struct Params { time: f32, aspect: f32, pointer: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

// パレット(v2: 白×墨×ブルー、すべて淡く)
const BG: vec3f     = vec3f(0.980, 0.980, 0.982); // #FAFAFA
const INK: vec3f    = vec3f(0.360, 0.385, 0.420); // 点用の薄墨
const GRAY: vec3f   = vec3f(0.700, 0.725, 0.760); // 大きめノード
const EDGE: vec3f   = vec3f(0.836, 0.848, 0.870); // エッジ #D5D8DE
const ARC: vec3f    = vec3f(0.885, 0.895, 0.912); // 大円弧
const ACCENT: vec3f = vec3f(0.145, 0.388, 0.922); // #2563EB

const N_NODES: u32 = 26u;
const N_EDGES: u32 = 31u;

fn sdSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  var q = vec2f(uv.x * params.aspect - params.aspect, uv.y) - params.pointer * 0.012;
  let t = params.time;
  var col = BG;

  // ピクセル基準の線半幅(デバイス解像度に依らず約 1px)
  let px = fwidth(q.x);
  let hair = px * 0.55;
  let aa = px * 1.2;

  // 下端・左端に向けて淡くフェード
  let fade = (1.0 - smoothstep(0.80, 1.02, uv.y)) * smoothstep(-2.6, -1.7, q.x) * 0.95;

  // --- 背景の大円弧(ごく淡い) ---
  {
    let d1 = abs(length(q - vec2f(-0.34, 0.10)) - 0.66);
    col = mix(col, ARC, (1.0 - smoothstep(hair, hair + aa, d1)) * 0.7 * fade);
    let d2 = abs(length(q - vec2f(-0.02, 0.58)) - 0.92);
    col = mix(col, ARC, (1.0 - smoothstep(hair, hair + aa, d2)) * 0.55 * fade);
    // 破線の弧(低速回転)
    let cc = vec2f(-0.70, 0.34);
    let dd = length(q - cc);
    let ang = atan2(q.y - cc.y, q.x - cc.x);
    let ph = fract(ang / 6.28318 * 60.0 + t * 0.004);
    let dash = smoothstep(0.10, 0.22, ph) * (1.0 - smoothstep(0.48, 0.60, ph));
    let d3 = abs(dd - 0.55);
    col = mix(col, ARC, (1.0 - smoothstep(hair, hair + aa, d3)) * dash * 0.6 * fade);
  }

  // --- ノード定義: (x, y, 半径px, 種別) 種別 0=薄墨 1=グレー大 2=中抜き 3=アクセント ---
  var nodes = array<vec4f, 26>(
    vec4f(-0.06, 0.10, 2.6, 0.0),
    vec4f(-0.16, 0.22, 4.6, 1.0),
    vec4f(-0.30, 0.14, 3.2, 2.0),
    vec4f(-0.44, 0.28, 2.6, 0.0),
    vec4f(-0.24, 0.34, 2.4, 0.0),
    vec4f(-0.10, 0.40, 3.0, 2.0),
    vec4f(-0.36, 0.46, 4.2, 1.0),
    vec4f(-0.54, 0.40, 3.2, 2.0),
    vec4f(-0.62, 0.24, 2.4, 0.0),
    vec4f(-0.50, 0.12, 3.6, 1.0),
    vec4f(-0.70, 0.52, 2.8, 2.0),
    vec4f(-0.44, 0.58, 2.6, 0.0),
    vec4f(-0.28, 0.62, 3.0, 2.0),
    vec4f(-0.14, 0.56, 2.4, 0.0),
    vec4f(-0.02, 0.62, 3.4, 1.0),
    vec4f(-0.58, 0.68, 2.8, 3.0),
    vec4f(-0.36, 0.76, 2.4, 0.0),
    vec4f(-0.20, 0.80, 3.0, 2.0),
    vec4f(-0.06, 0.78, 2.4, 0.0),
    vec4f(-0.78, 0.36, 2.4, 0.0),
    vec4f(-0.86, 0.60, 2.8, 2.0),
    vec4f(-0.66, 0.82, 3.4, 1.0),
    vec4f(-0.48, 0.88, 2.8, 2.0),
    vec4f(-0.90, 0.16, 2.4, 0.0),
    vec4f(-0.12, 0.94, 2.4, 0.0),
    vec4f(-0.32, 0.96, 2.6, 2.0),
  );

  // 漂い(エッジも同じ座標から導出するのでズレない)
  var pos: array<vec2f, 26>;
  for (var i = 0u; i < N_NODES; i++) {
    let fi = f32(i);
    let drift = 0.007 * vec2f(sin(t * 0.24 + fi * 2.13), cos(t * 0.19 + fi * 1.37));
    pos[i] = nodes[i].xy + drift;
  }

  // --- エッジ ---
  var edges = array<u32, 62>(
    0u,1u, 1u,2u, 2u,3u, 1u,4u, 4u,5u, 4u,6u, 6u,7u, 7u,8u, 8u,9u, 2u,9u,
    7u,10u, 6u,11u, 11u,12u, 12u,13u, 13u,14u, 11u,15u, 15u,16u, 16u,17u,
    17u,18u, 13u,5u, 19u,8u, 19u,20u, 20u,21u, 21u,22u, 16u,22u, 10u,20u,
    3u,4u, 9u,23u, 17u,24u, 22u,25u, 12u,16u,
  );
  for (var e = 0u; e < N_EDGES; e++) {
    let a = pos[edges[e * 2u]];
    let b = pos[edges[e * 2u + 1u]];
    let d = sdSegment(q, a, b);
    col = mix(col, EDGE, (1.0 - smoothstep(hair, hair + aa, d)) * 0.85 * fade);
  }

  // --- ノード ---
  for (var i = 0u; i < N_NODES; i++) {
    let r = nodes[i].z * px;
    let kind = nodes[i].w;
    let d = length(q - pos[i]);
    if (kind < 0.5) {
      col = mix(col, INK, (1.0 - smoothstep(r, r + aa, d)) * 0.9 * fade);
    } else if (kind < 1.5) {
      col = mix(col, GRAY, (1.0 - smoothstep(r, r + aa, d)) * fade);
    } else if (kind < 2.5) {
      col = mix(col, BG, (1.0 - smoothstep(r, r + aa, d)) * fade);
      let ring = 1.0 - smoothstep(hair, hair + aa, abs(d - r));
      col = mix(col, GRAY, ring * fade);
    } else {
      // アクセント: 静かな鼓動+ごく淡いハロー
      let pulse = 0.5 + 0.5 * sin(t * 1.4);
      let halo = exp(-d / (px * 16.0)) * (0.10 + 0.10 * pulse);
      col = mix(col, ACCENT, halo * fade);
      col = mix(col, ACCENT, (1.0 - smoothstep(r + px * pulse, r + px * pulse + aa, d)) * fade);
    }
  }

  return vec4f(col, 1.0);
}
`
