#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;

in vec2 fs_Pos;
out vec4 out_Col;

#define MAX_DIST 500.0

float random1(vec2 p, vec2 seed) {
  return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

float bias(float b, float t) {
  return pow(t, log(b) / log(0.5));
}

float quinticSmooth(float t) {
  float x = clamp(t, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0  - 15.0) + 10.0);
}

float interpRand(float x, float z) {
  vec2 seed = vec2(0.0, 0.0);

  float intX = floor(x);
  float fractX = fract(x);
  float intZ = floor(z);
  float fractZ = fract(z);

  vec2 c1 = vec2(intX, intZ);
  vec2 c2 = vec2(intX + 1.0, intZ);
  vec2 c3 = vec2(intX, intZ + 1.0);
  vec2 c4 = vec2(intX + 1.0, intZ + 1.0);

  float v1 = random1(c1, seed);
  float v2 = random1(c2, seed);
  float v3 = random1(c3, seed);
  float v4 = random1(c4, seed);

  float i1 = mix(v1, v2, quinticSmooth(fractX));
  float i2 = mix(v3, v4, quinticSmooth(fractX));
  return mix(i1, i2, quinticSmooth(fractZ));
}

float skyTexture(vec3 pos) {
  float total = 0.0;
  int octaves = 8;
  float persistence = 0.4;
  for (int i = 0; i < octaves; i++) {
    float freq = pow(2.0, float(i)) * 0.001;
    float amp = pow(persistence, float(i));
    total += interpRand(pos.x * freq, pos.z * freq) * amp;
  }
  return 1.0 - bias(0.5, total);
}

void main()
{
  float fovy = 90.0;
  vec3 look = u_Ref - u_Eye;
  vec3 right = normalize(cross(look, u_Up));
  float aspect = float(u_Dimensions.x) / float(u_Dimensions.y);
  float tan_fovy2 = tan(fovy / 2.0);
  vec3 h = right * length(look) * aspect * tan_fovy2;
  vec3 v = u_Up * length(look) * tan_fovy2;
  vec3 p = u_Ref + fs_Pos.x * h + fs_Pos.y * v;
  vec3 rayDirect = normalize(p - u_Eye);

  if (rayDirect.y < 0.0) {
    float skyDist = (MAX_DIST * 10.0 - u_Eye.y) / rayDirect.y;
    float cloudCover = skyTexture(u_Eye + rayDirect * skyDist);
    out_Col = vec4(vec3(0.2, 0.2, 0.3) * cloudCover + vec3(0.4, 0.4, 0.4), 1.0);
  } else {
    out_Col = vec4(51.0 / 255.0, 153.0 / 255.0, 255.0 / 255.0, 1.0);
  }
}
