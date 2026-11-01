/**
 * GLSL for the Developer Universe. Fragment shaders end with three.js's
 * colour-space chunk so colours match the sRGB palette exactly.
 */

/**
 * 3D simplex noise — Ian McEwan, Ashima Arts / Stefan Gustavson (MIT).
 * https://github.com/ashima/webgl-noise
 */
const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

const VIEW_VARYINGS_VERTEX = /* glsl */ `
varying vec3 vObjectPosition;
varying vec3 vNormalView;
varying vec3 vPositionView;

void main() {
  vObjectPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vPositionView = mvPosition.xyz;
  vNormalView = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const SUN_VERTEX = VIEW_VARYINGS_VERTEX

export const SUN_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uForm;
uniform float uDetail;
uniform float uIntensity;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uHigh;
uniform vec3 uHot;

varying vec3 vObjectPosition;
varying vec3 vNormalView;
varying vec3 vPositionView;

${SIMPLEX_NOISE}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p);
    p = p * 2.03 + 7.13;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec3 N = normalize(vNormalView);
  vec3 V = normalize(-vPositionView);
  float mu = clamp(dot(N, V), 0.0, 1.0);
  float t = uTime * 0.04;
  vec3 p = vObjectPosition * 1.8;

  // Soft internal plasma and fine drifting filaments give the core depth.
  float base = fbm(p + vec3(t, -t * 0.7, t * 0.5));
  float cells = snoise(p * 3.1 - vec3(t * 1.3, t, -t * 0.8));
  float filaments = pow(1.0 - abs(cells), 7.0);
  float flow = snoise(p * 0.9 + vec3(0.0, t * 1.6, 0.0));
  float waves = pow(0.5 + 0.5 * sin(vObjectPosition.y * 7.0 + flow * 2.1 - uTime * 0.16), 18.0);
  float maria = smoothstep(0.15, 0.55, snoise(p * 0.75 + 3.7));

  float heat = 0.49 + 0.24 * base;
  heat += (filaments * 0.22 + waves * 0.08 - maria * 0.1) * uDetail;

  vec3 color = mix(uDeep, uMid, smoothstep(0.2, 0.62, heat));
  color = mix(color, uHigh, smoothstep(0.55, 0.9, heat) * 0.62);
  color = mix(color, uHot, smoothstep(0.86, 1.15, heat) * 0.3);

  // Let the environment show through the glass, with a deeper amber centre
  // behind the bright title and more light gathered at the sphere's limb.
  color *= 0.16 - 0.05 * mu;
  color += uHigh * pow(1.0 - mu, 3.0) * 0.42;
  color += uHigh * filaments * uDetail * 0.055;

  vec3 keyLight = normalize(vec3(-0.45, 0.6, 0.65));
  float reflection = pow(max(dot(reflect(-keyLight, N), V), 0.0), 28.0);
  color += vec3(1.0, 0.96, 0.88) * reflection * 0.1 * uDetail;

  // The body condenses from the centre of the disc outwards.
  float edge = uForm * 1.25 - (1.0 - mu) - base * 0.12;
  float formMask = smoothstep(0.0, 0.12, edge);
  float alpha = formMask * (0.1 + 0.06 * (1.0 - mu) + filaments * 0.015 * uDetail);
  color = mix(uHot * 1.15, color, smoothstep(0.0, 0.55, uForm));

  gl_FragColor = vec4(color * uIntensity, alpha);
  #include <colorspace_fragment>
}
`

/** Thin, animated Fresnel shell over the warm translucent solar interior. */
export const SUN_GLASS_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uForm;
uniform float uDetail;
uniform float uIntensity;
uniform vec3 uMid;
uniform vec3 uHigh;
uniform vec3 uHot;

varying vec3 vObjectPosition;
varying vec3 vNormalView;
varying vec3 vPositionView;

${SIMPLEX_NOISE}

void main() {
  vec3 N = normalize(vNormalView);
  vec3 V = normalize(-vPositionView);
  float facing = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.2);
  float rimLine = pow(fresnel, 8.0);
  float t = uTime * 0.018;

  vec3 p = vObjectPosition * 4.2;
  float field = snoise(p + vec3(t, -t * 0.72, t * 0.35));
  float fibers = pow(1.0 - abs(snoise(p * 1.7 + vec3(-t, t * 0.55, t))), 9.0);
  float arcs = pow(0.5 + 0.5 * sin(vObjectPosition.y * 7.0 + field * 2.4 + t * 2.0), 20.0);
  float sweepA = abs(vObjectPosition.y - 0.18 * sin(vObjectPosition.x * 2.8 + t));
  float sweepB = abs(vObjectPosition.y + 0.14 * sin(vObjectPosition.z * 3.2 - t * 0.8));
  float energyArc = exp(-sweepA * 30.0) + exp(-sweepB * 34.0);

  vec3 keyLight = normalize(vec3(-0.48, 0.65, 0.58));
  float reflection = pow(max(dot(reflect(-keyLight, N), V), 0.0), 76.0);
  float glint = pow(max(dot(reflect(-normalize(vec3(0.75, 0.2, 0.6)), N), V), 0.0), 112.0);

  vec3 color = mix(uMid, uHigh, clamp(0.16 + fresnel * 0.76 + fibers * 0.12, 0.0, 1.0));
  color = mix(
    color,
    uHot,
    clamp(reflection * 0.72 + glint * 0.8 + rimLine * 0.72, 0.0, 0.9)
  );
  color += uHigh * (fibers * 0.11 + arcs * 0.055) * uDetail;
  color += uHot * energyArc * uDetail * 0.13;

  float formed = smoothstep(0.02, 0.72, uForm);
  float pulse = 1.0 + sin(uTime * 0.32) * 0.012;
  float alpha = formed * pulse * (
    0.018 + fresnel * 0.42 + rimLine * 0.33 + reflection * 0.2 + glint * 0.27
    + (fibers * 0.065 + arcs * 0.035 + energyArc * 0.09) * uDetail
  );
  alpha = clamp(alpha, 0.0, 0.76);

  gl_FragColor = vec4(color * uIntensity, alpha);
  #include <colorspace_fragment>
}
`

export const ATMOSPHERE_VERTEX = VIEW_VARYINGS_VERTEX

/** Rendered on the back faces of a slightly larger sphere: a soft limb glow with slow ripples. */
export const ATMOSPHERE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;

varying vec3 vObjectPosition;
varying vec3 vNormalView;
varying vec3 vPositionView;

void main() {
  vec3 N = normalize(vNormalView);
  vec3 V = normalize(-vPositionView);
  float depth = clamp(-dot(N, V), 0.0, 1.0);
  float glow = pow(depth, 1.7);
  float radius = sqrt(max(1.0 - depth * depth, 0.0));
  float ripple = 0.5 + 0.5 * sin(radius * 26.0 - uTime * 1.4);
  glow *= 0.8 + 0.2 * ripple;
  gl_FragColor = vec4(uColor, glow * uOpacity);
  #include <colorspace_fragment>
}
`

export const PLANET_VERTEX = /* glsl */ `
varying vec3 vObjectPosition;
varying vec3 vNormalView;
varying vec3 vPositionView;
varying vec3 vCentreView;

void main() {
  vObjectPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vPositionView = mvPosition.xyz;
  vNormalView = normalize(normalMatrix * normal);
  vCentreView = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`

export const PLANET_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uRimColor;
uniform vec3 uSunView;
uniform sampler2D uLogo;
uniform float uLogoScale;
uniform float uLogoReveal;
uniform float uHighlight;
uniform float uOpacity;
uniform float uSurface;
uniform float uSeed;

varying vec3 vObjectPosition;
varying vec3 vNormalView;
varying vec3 vPositionView;
varying vec3 vCentreView;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float valueNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * valueNoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec3 N = normalize(vNormalView);
  vec3 V = normalize(-vPositionView);
  vec3 L = normalize(uSunView - vPositionView);

  vec3 p = vObjectPosition * 2.4 + uSeed;
  float n = fbm(p);
  float surface;
  if (uSurface < 0.5) {
    surface = 0.55 + 0.45 * sin(vObjectPosition.y * 9.0 + n * 3.0);
  } else if (uSurface < 1.5) {
    surface = smoothstep(0.25, 0.85, n);
  } else if (uSurface < 2.5) {
    surface = 0.65 + 0.35 * n;
  } else {
    surface = pow(abs(sin(n * 12.0)), 6.0) * 0.6 + n * 0.6;
  }

  vec3 albedo = uColor * (0.75 + 0.7 * surface);
  float lambert = max(dot(N, L), 0.0);
  float wrapped = max((dot(N, L) + 0.35) / 1.35, 0.0);
  vec3 halfway = normalize(L + V);
  float shininess = uSurface > 2.5 ? 0.55 : 0.22;
  float specular = pow(max(dot(N, halfway), 0.0), 36.0) * shininess * lambert;
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  vec3 color = albedo * (0.2 + 1.2 * wrapped) + vec3(1.0, 0.86, 0.6) * specular;
  vec3 rim = mix(uRimColor, uColor * 2.4 + 0.08, 0.45);
  color += rim * fresnel * (0.4 + 0.9 * uHighlight);

  // The mark is projected onto the hemisphere facing the camera, so it
  // wraps the curvature while staying upright and readable.
  vec3 toCamera = normalize(-vCentreView);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
  vec3 up = cross(toCamera, right);
  vec2 logoUv = vec2(dot(N, right), dot(N, up)) * (0.5 * uLogoScale) + 0.5;
  float facing = smoothstep(0.25, 0.6, dot(N, toCamera));
  vec4 logo = texture2D(uLogo, logoUv);
  float logoMask = logo.a * facing * uLogoReveal;
  vec3 logoColor = logo.rgb * (0.88 + 0.22 * wrapped + 0.35 * uHighlight);
  color = mix(color, logoColor, logoMask);

  color += uColor * 0.55 * uHighlight + vec3(1.0, 0.8, 0.5) * 0.05 * uHighlight;

  gl_FragColor = vec4(color, uOpacity);
  #include <colorspace_fragment>
}
`

export const STAR_VERTEX = /* glsl */ `
attribute float aSize;
attribute float aBrightness;
attribute float aSpeed;
attribute float aPhase;
attribute float aThreshold;
attribute float aTwinkle;
attribute vec3 aColor;

uniform float uTime;
uniform float uReveal;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float pulse = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
  float twinkle = mix(1.0, 0.22 + 0.78 * pulse * pulse, aTwinkle);
  float reveal = smoothstep(aThreshold, aThreshold + 0.1, uReveal);
  vAlpha = aBrightness * twinkle * reveal;
  vColor = aColor;
  gl_PointSize = aSize * uPixelRatio * clamp(150.0 / -mvPosition.z, 0.6, 2.4) * (0.85 + 0.15 * twinkle);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const POINT_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float distanceFromCentre = length(gl_PointCoord - 0.5);
  float core = 1.0 - smoothstep(0.0, 0.5, distanceFromCentre);
  float alpha = pow(core, 1.8) * vAlpha;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(vColor, alpha);
  #include <colorspace_fragment>
}
`

/** Particles revolving around the vertical axis (golden dust, sun corona). */
export const SWIRL_VERTEX = /* glsl */ `
attribute float aRadius;
attribute float aAngle;
attribute float aHeight;
attribute float aSpeed;
attribute float aSize;
attribute float aPhase;

uniform float uTime;
uniform float uReveal;
uniform float uOpacity;
uniform float uPixelRatio;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float angle = aAngle + uTime * aSpeed;
  vec3 p = vec3(cos(angle) * aRadius, aHeight + sin(uTime * 0.3 + aPhase) * 0.06, sin(angle) * aRadius);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  float flicker = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * 0.8 + aPhase));
  vAlpha = uReveal * uOpacity * flicker;
  vColor = mix(uColorA, uColorB, fract(aPhase * 0.159));
  gl_PointSize = aSize * uPixelRatio * clamp(110.0 / -mvPosition.z, 0.5, 3.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

/** Golden particles that converge into a planet as it arrives. */
export const CONVERGE_VERTEX = /* glsl */ `
attribute vec3 aOffset;
attribute float aSize;
attribute float aDelay;

uniform float uEntrance;
uniform float uSpread;
uniform float uPixelRatio;
uniform vec3 uColor;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float e = clamp((uEntrance - aDelay * 0.3) / 0.7, 0.0, 1.0);
  float gather = e * e * (3.0 - 2.0 * e);
  vec3 p = aOffset * (1.0 - gather) * uSpread;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vAlpha = sin(3.14159265 * e) * 0.9;
  vColor = uColor;
  gl_PointSize = aSize * uPixelRatio * clamp(120.0 / -mvPosition.z, 0.5, 3.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const ORBIT_VERTEX = /* glsl */ `
attribute float aT;
attribute float aAcross;

uniform float uCameraDistance;
uniform float uRadius;

varying float vT;
varying float vAcross;
varying float vFade;

void main() {
  vT = aT;
  vAcross = aAcross;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float depth = -mvPosition.z - uCameraDistance;
  vFade = mix(1.0, 0.4, smoothstep(-uRadius, uRadius, depth));
  gl_Position = projectionMatrix * mvPosition;
}
`

export const ORBIT_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uDraw;
uniform float uPresence;
uniform float uHighlight;
uniform float uSoftEdge;

varying float vT;
varying float vAcross;
varying float vFade;

void main() {
  float drawn = uDraw >= 1.0 ? 1.0 : 1.0 - smoothstep(uDraw - 0.025, uDraw, vT);
  float alpha = max(drawn, uPresence * 0.3) * uOpacity * vFade * (1.0 + 1.6 * uHighlight);
  float edge = 1.0 - abs(vAcross);
  alpha *= mix(1.0, edge * edge, uSoftEdge);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(uColor, alpha);
  #include <colorspace_fragment>
}
`

export const ENERGY_VERTEX = /* glsl */ `
attribute float aSize;
attribute float aVisible;
uniform float uPixelRatio;
uniform float uOpacity;
uniform vec3 uColor;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vAlpha = uOpacity * aVisible;
  vColor = uColor;
  gl_PointSize = aSize * uPixelRatio * clamp(120.0 / -mvPosition.z, 0.6, 3.0);
  gl_Position = projectionMatrix * mvPosition;
}
`
