// トップページヒーロー背面の「依存グラフ星座」(vgpu / WebGPU 用 WGSL)。
// 動きの設計(すべて「依存解決」のメタファー):
//   1. ドローイン: ロード時にノードが先に灯り、エッジが節から節へ伸びる(1 回だけ)
//   2. リゾルブ・シグナル: 7 秒周期で青い光点がエッジを伝い、pnpm ノードに着弾して閃く
//   3. カーソル・プローブ: マウス付近の配線が浮かび上がり、ノードがわずかに膨らむ
// エッジは常にノード座標から導出するため、点と線は決して離れない。
// 座標系: 右端を x=0 とし左へ負(q = uv.x*aspect - aspect)。y は 0(上)〜1(下)。
// dark uniform(0/1)で白紙⇄墨紙のパレットを補間する。
export const NETWORK_WGSL = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f, // ビューポート正規化(視差用)
  pscene: vec2f,  // キャンバス座標系のカーソル位置(プローブ用)
  dark: f32,      // 0 = ライト / 1 = ダーク
}
@group(0) @binding(0) var<uniform> params: Params;

const N_NODES: u32 = 26u;
const N_EDGES: u32 = 31u;
const N_PATH: u32 = 6u;
const SEG_DUR: f32 = 0.34;
const SIGNAL_PERIOD: f32 = 7.0;

fn sdSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  var q = vec2f(uv.x * params.aspect - params.aspect, uv.y) - params.pointer * 0.012;
  let t = params.time;
  let tt = max(t - 5.0, 0.0);
  let dk = params.dark;

  // パレット(ライト⇄ダークを補間)
  let BG     = mix(vec3f(0.980, 0.980, 0.982), vec3f(0.063, 0.075, 0.098), dk);
  let INK    = mix(vec3f(0.360, 0.385, 0.420), vec3f(0.720, 0.760, 0.830), dk);
  let PROBE  = mix(vec3f(0.470, 0.500, 0.545), vec3f(0.610, 0.660, 0.760), dk);
  let GRAY   = mix(vec3f(0.700, 0.725, 0.760), vec3f(0.430, 0.470, 0.550), dk);
  let EDGE   = mix(vec3f(0.836, 0.848, 0.870), vec3f(0.230, 0.258, 0.312), dk);
  let ARC    = mix(vec3f(0.885, 0.895, 0.912), vec3f(0.160, 0.182, 0.222), dk);
  let ACCENT = mix(vec3f(0.145, 0.388, 0.922), vec3f(0.357, 0.549, 1.000), dk);

  var col = BG;

  // ワイド画面ほど星座を拡大(モバイルは等倍)
  let S = clamp(params.aspect * 0.60, 1.0, 1.9);
  let A = vec2f(-0.02, 0.42);

  let px = fwidth(q.x);
  let hair = px * 0.55;
  let aa = px * 1.2;

  let fade = (1.0 - smoothstep(0.80, 1.02, uv.y)) * smoothstep(-2.9 * S, -1.7 * S, q.x) * 0.95;

  // --- 背景の大円弧 ---
  {
    let arcIn = smoothstep(0.0, 1.2, tt);
    let d1 = abs(length(q - (A + (vec2f(-0.34, 0.10) - A) * S)) - 0.66 * S);
    col = mix(col, ARC, (1.0 - smoothstep(hair, hair + aa, d1)) * 0.7 * fade * arcIn);
    let d2 = abs(length(q - (A + (vec2f(-0.02, 0.58) - A) * S)) - 0.92 * S);
    col = mix(col, ARC, (1.0 - smoothstep(hair, hair + aa, d2)) * 0.55 * fade * arcIn);
    let cc = A + (vec2f(-0.70, 0.34) - A) * S;
    let dd = length(q - cc);
    let ang = atan2(q.y - cc.y, q.x - cc.x);
    let ph = fract(ang / 6.28318 * 60.0 + t * 0.004);
    let dash = smoothstep(0.10, 0.22, ph) * (1.0 - smoothstep(0.48, 0.60, ph));
    let d3 = abs(dd - 0.55 * S);
    col = mix(col, ARC, (1.0 - smoothstep(hair, hair + aa, d3)) * dash * 0.6 * fade * arcIn);
  }

  // --- ノード定義: (x, y, 半径px, 種別) 0=薄墨 1=グレー大 2=中抜き 3=アクセント ---
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

  var pos: array<vec2f, 26>;
  for (var i = 0u; i < N_NODES; i++) {
    let fi = f32(i);
    let drift = 0.007 * vec2f(sin(t * 0.24 + fi * 2.13), cos(t * 0.19 + fi * 1.37));
    pos[i] = A + (nodes[i].xy - A) * S + drift * S;
  }

  let m = params.pscene - params.pointer * 0.012;
  let probeR = 0.24 * S;

  // --- エッジ(ドローイン: 節から節へ伸びる) ---
  var edges = array<u32, 62>(
    0u,1u, 1u,2u, 2u,3u, 1u,4u, 4u,5u, 4u,6u, 6u,7u, 7u,8u, 8u,9u, 2u,9u,
    7u,10u, 6u,11u, 11u,12u, 12u,13u, 13u,14u, 11u,15u, 15u,16u, 16u,17u,
    17u,18u, 13u,5u, 19u,8u, 19u,20u, 20u,21u, 21u,22u, 16u,22u, 10u,20u,
    3u,4u, 9u,23u, 17u,24u, 22u,25u, 12u,16u,
  );
  for (var e = 0u; e < N_EDGES; e++) {
    let a = pos[edges[e * 2u]];
    let b = pos[edges[e * 2u + 1u]];
    let grow = clamp((tt - 0.10 - f32(e) * 0.042) / 0.45, 0.0, 1.0);
    if (grow <= 0.0) { continue; }
    let bCap = mix(a, b, smoothstep(0.0, 1.0, grow));
    let d = sdSegment(q, a, bCap);
    let mask = 1.0 - smoothstep(hair, hair + aa, d);
    let probe = exp(-length(q - m) / probeR) * 0.85;
    let edgeCol = mix(EDGE, PROBE, probe);
    col = mix(col, edgeCol, mask * (0.85 + probe * 0.15) * fade);
  }

  // --- リゾルブ・シグナル ---
  var path = array<u32, 6>(0u, 1u, 4u, 6u, 11u, 15u);
  let cycleT = (tt - 2.2) % SIGNAL_PERIOD;
  let travel = SEG_DUR * f32(N_PATH - 1u);
  var arrive = 0.0;
  if (tt > 2.2) {
    if (cycleT < travel) {
      let k = u32(floor(cycleT / SEG_DUR));
      let local = smoothstep(0.0, 1.0, fract(cycleT / SEG_DUR));
      let sp = mix(pos[path[k]], pos[path[k + 1u]], local);
      let dSig = length(q - sp);
      col = mix(col, ACCENT, exp(-dSig / (px * 9.0)) * 0.85 * fade);
      let tail = sdSegment(q, mix(pos[path[k]], sp, max(0.0, local - 0.35) / max(local, 0.001)), sp);
      col = mix(col, ACCENT, (1.0 - smoothstep(hair, hair + aa * 2.0, tail)) * 0.35 * local * fade);
      for (var n = 0u; n <= k; n++) {
        let ago = cycleT - f32(n) * SEG_DUR;
        let blip = exp(-max(ago, 0.0) * 2.4);
        col = mix(col, ACCENT, (1.0 - smoothstep(px * 3.4, px * 3.4 + aa, length(q - pos[path[n]]))) * blip * 0.5 * fade);
      }
    }
    arrive = exp(-max(cycleT - travel, 0.0) * 2.8) * step(travel, cycleT);
  }

  // --- ノード ---
  for (var i = 0u; i < N_NODES; i++) {
    let appear = smoothstep(0.0, 0.3, tt - f32(i) * 0.03);
    if (appear <= 0.0) { continue; }
    let swell = 1.0 + 0.30 * exp(-length(pos[i] - m) / (0.10 * S));
    let r = nodes[i].z * px * (0.5 + 0.5 * appear) * swell;
    let kind = nodes[i].w;
    let d = length(q - pos[i]);
    let al = appear * fade;
    if (kind < 0.5) {
      col = mix(col, INK, (1.0 - smoothstep(r, r + aa, d)) * 0.9 * al);
    } else if (kind < 1.5) {
      col = mix(col, GRAY, (1.0 - smoothstep(r, r + aa, d)) * al);
    } else if (kind < 2.5) {
      col = mix(col, BG, (1.0 - smoothstep(r, r + aa, d)) * al);
      let ring = 1.0 - smoothstep(hair, hair + aa, abs(d - r));
      col = mix(col, GRAY, ring * al);
    } else {
      let pulse = 0.5 + 0.5 * sin(t * 1.4);
      let glow = 0.10 + 0.10 * pulse + arrive * 0.55;
      col = mix(col, ACCENT, exp(-d / (px * 16.0)) * glow * al);
      col = mix(col, ACCENT, (1.0 - smoothstep(r + px * (pulse + arrive * 2.0), r + px * (pulse + arrive * 2.0) + aa, d)) * al);
    }
  }

  return vec4f(col, 1.0);
}
`
