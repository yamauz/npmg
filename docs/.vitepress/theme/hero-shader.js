// トップページヒーローの軌道ダイアグラム(vgpu / WebGPU 用 WGSL)。
// すべての点は 中心 + 半径 × (cosθ(t), sinθ(t)) で解析的に配置するため、
// 軌道からのズレは構造的に発生しない。座標系は「px / 520」(SVG 版と同一)。
// ラベル(node_modules / npm / yarn / pnpm)は DOM 側で重ねる。
export const ORBIT_WGSL = /* wgsl */ `
struct Params { time: f32, aspect: f32, pointer: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

const PI: f32 = 3.14159265;

// パレット(v2: 白×墨×ブルー)
const BG: vec3f     = vec3f(0.980, 0.980, 0.982); // #FAFAFA
const INK: vec3f    = vec3f(0.110, 0.118, 0.129); // #1C1E21
const GRAY: vec3f   = vec3f(0.604, 0.631, 0.675); // #9AA1AC
const RULE: vec3f   = vec3f(0.851, 0.863, 0.886); // #D9DCE2
const ACCENT: vec3f = vec3f(0.145, 0.388, 0.922); // #2563EB

// 中心とリング半径(px/520)
const C: vec2f = vec2f(0.4808, 0.5);
const R1: f32 = 0.2231; // 実線
const R2: f32 = 0.3308; // 点線
const R3: f32 = 0.4385; // 破線

fn sdSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// 塗り点(半径 r)
fn disc(p: vec2f, center: vec2f, r: f32, aa: f32) -> f32 {
  return 1.0 - smoothstep(r, r + aa, length(p - center));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // マウス視差(全体をわずかに平行移動)
  var p = vec2f(uv.x * params.aspect, uv.y) - params.pointer * 0.014;
  let t = params.time;
  var col = BG;

  let dd = length(p - C);
  let aa = fwidth(dd) * 1.5 + 0.0002;
  let hair = 0.0011; // ヘアライン半幅

  // --- リング 1: 実線 ---
  let ring1 = 1.0 - smoothstep(hair, hair + aa, abs(dd - R1));
  col = mix(col, GRAY, ring1 * 0.75);

  // --- リング 2: 点線(ごく低速で回転) ---
  let ang = atan2(p.y - C.y, p.x - C.x);
  {
    let n = 88.0;
    let ph = fract(ang / (2.0 * PI) * n + t * 0.006);
    let tangential = (ph - 0.5) * (2.0 * PI / n) * dd;
    let q = length(vec2f(dd - R2, tangential));
    let dot2 = 1.0 - smoothstep(0.0015, 0.0015 + aa, q);
    col = mix(col, GRAY, dot2 * 0.8);
  }

  // --- リング 3: 破線(逆方向にごく低速で回転) ---
  {
    let n = 56.0;
    let ph = fract(ang / (2.0 * PI) * n - t * 0.004);
    let dash = smoothstep(0.08, 0.16, ph) * (1.0 - smoothstep(0.44, 0.52, ph));
    let radial = 1.0 - smoothstep(hair, hair + aa, abs(dd - R3));
    col = mix(col, GRAY, radial * dash * 0.75);
  }

  // --- 軌道上を周回する点(半径はリングと厳密に一致) ---
  // (ring radius, angular speed, phase, kind) kind: 0=塗り 1=中抜き
  var orbits = array<vec4f, 8>(
    vec4f(R3,  0.040, 1.15, 0.0),
    vec4f(R3,  0.040, 3.60, 1.0),
    vec4f(R3,  0.040, 5.30, 0.0),
    vec4f(R2, -0.030, 0.55, 1.0),
    vec4f(R2, -0.030, 2.75, 0.0),
    vec4f(R2, -0.030, 4.90, 1.0),
    vec4f(R1,  0.022, 2.20, 0.0),
    vec4f(R1,  0.022, 5.05, 1.0),
  );
  for (var i = 0; i < 8; i++) {
    let o = orbits[i];
    let a = o.z + t * o.y;
    let pos = C + o.x * vec2f(cos(a), sin(a));
    if (o.w < 0.5) {
      col = mix(col, INK, disc(p, pos, 0.0055, aa));
    } else {
      // 中抜き点: 下のリング線を消してから輪郭を描く
      col = mix(col, BG, disc(p, pos, 0.0052, aa));
      let ring = 1.0 - smoothstep(hair, hair + aa, abs(length(p - pos) - 0.0044));
      col = mix(col, GRAY, ring);
    }
  }

  // --- 中心の依存ツリー ---
  let root  = vec2f(0.4808, 0.4769);
  let mid   = vec2f(0.4808, 0.5500);
  let c1    = vec2f(0.4154, 0.5942);
  let c2    = vec2f(0.4808, 0.6096);
  let c3    = vec2f(0.5462, 0.5942);
  var segsA = array<vec2f, 8>(root, mid, mid, c1, mid, c2, mid, c3);
  for (var i = 0; i < 4; i++) {
    let d = sdSegment(p, segsA[i * 2], segsA[i * 2 + 1]);
    col = mix(col, GRAY, 1.0 - smoothstep(hair, hair + aa, d));
  }
  let l1 = vec2f(0.3962, 0.6442);
  let l2 = vec2f(0.4269, 0.6481);
  let l3 = vec2f(0.4692, 0.6635);
  let l4 = vec2f(0.4962, 0.6596);
  let l5 = vec2f(0.5346, 0.6481);
  let l6 = vec2f(0.5654, 0.6442);
  var segsB = array<vec2f, 12>(c1, l1, c1, l2, c2, l3, c2, l4, c3, l5, c3, l6);
  for (var i = 0; i < 6; i++) {
    let d = sdSegment(p, segsB[i * 2], segsB[i * 2 + 1]);
    col = mix(col, GRAY, 1.0 - smoothstep(hair, hair + aa, d));
  }
  // ノード: 根と子は塗り、葉は中抜き
  col = mix(col, INK, disc(p, root, 0.0092, aa));
  col = mix(col, INK, disc(p, c1, 0.0062, aa));
  col = mix(col, INK, disc(p, c2, 0.0062, aa));
  col = mix(col, INK, disc(p, c3, 0.0062, aa));
  var leaves = array<vec2f, 6>(l1, l2, l3, l4, l5, l6);
  for (var i = 0; i < 6; i++) {
    col = mix(col, BG, disc(p, leaves[i], 0.0048, aa));
    let ring = 1.0 - smoothstep(hair, hair + aa, abs(length(p - leaves[i]) - 0.004));
    col = mix(col, GRAY, ring);
  }

  // --- 引き出し線とアンカー(ラベルは DOM 側) ---
  let leaderEndX = 0.8192;
  let a1 = vec2f(0.6346, 0.3346);
  let a2 = vec2f(0.7038, 0.4192);
  let a3 = vec2f(0.5962, 0.5038);
  let a4 = vec2f(0.6769, 0.5885);
  var anchors = array<vec2f, 4>(a1, a2, a3, a4);
  for (var i = 0; i < 4; i++) {
    let d = sdSegment(p, anchors[i], vec2f(leaderEndX, anchors[i].y));
    col = mix(col, RULE, 1.0 - smoothstep(hair, hair + aa, d));
  }
  // node_modules: 中抜き / npm・yarn: 塗り
  col = mix(col, BG, disc(p, a1, 0.0052, aa));
  let a1ring = 1.0 - smoothstep(hair, hair + aa, abs(length(p - a1) - 0.0044));
  col = mix(col, GRAY, a1ring);
  col = mix(col, INK, disc(p, a2, 0.0055, aa));
  col = mix(col, INK, disc(p, a3, 0.0055, aa));

  // pnpm: アクセント。静かな鼓動+淡いハロー
  let pulse = 0.5 + 0.5 * sin(t * 1.6);
  let halo = exp(-length(p - a4) * 90.0) * (0.22 + 0.20 * pulse);
  col = mix(col, ACCENT, halo);
  col = mix(col, ACCENT, disc(p, a4, 0.0068 + 0.0014 * pulse, aa));

  return vec4f(col, 1.0);
}
`
