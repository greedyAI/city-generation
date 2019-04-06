#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;

in vec3 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_Col;

out vec4 out_Col;

#define EPSILON 0.0001

float random1(vec2 p, vec2 seed) {
  return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 randvec3(vec2 n, vec2 seed) {
  float x = sin(dot(n + seed, vec2(14.92, 64.42)));
  float y = sin(dot(n + seed, vec2(48.12, 32.42)));
  return fract(334.963f * vec2(x, y));
}

float bias(float b, float t) {
  return pow(t, log(b) / log(0.5));
}

float quinticSmooth(float t) {
  float x = clamp(t, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0  - 15.0) + 10.0);
}

float worleyNoise(vec2 pos) {
  float factor = 8.0;
  vec2 seed = vec2(0.0, 0.0);

  int x = int(floor(pos.x / factor));
  int y = int(floor(pos.y / factor));
  vec2 minWorley = factor * randvec3(vec2(float(x), float(y)), seed) + vec2(float(x) * factor, float(y) * factor);
  float minDist = distance(minWorley, pos);
  for (int i = x - 1; i <= x + 1; i++) {
      for (int j = y - 1; j <= y + 1; j++) {
          vec2 worley = factor * randvec3(vec2(float(i), float(j)), seed) + vec2(float(i) * factor, float(j) * factor);
          if (minDist > distance(pos, worley)) {
              minDist = distance(pos, worley);
              minWorley = worley;
          }
      }
  }
  return clamp(minDist / (factor * 2.0), 0.0, 0.5);
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

float mediumTexture(float x, float y, float z) {
  float total = 0.0;
  int octaves = 16;
  float persistence = 0.7;
  for (int i = 0; i < octaves; i++) {
    float freq = pow(2.5, float(i));
    float amp = pow(persistence, float(i));
    total += worleyNoise(vec2(x + z * freq, y * freq)) * amp;
  }
  return total;
}

float houseTexture(vec3 pos) {
  float total = 0.0;
  int octaves = 8;
  float persistence = 0.5;
  for (int i = 0; i < octaves; i++) {
    float freq = pow(2.0, float(i));
    float amp = pow(persistence, float(i));
    total += interpRand(pos.x * freq, pos.z * freq) * amp;
  }
  if (total < 0.75) {
    return 1.0 - bias(0.3, total);
  }
  return 1.0 - bias(0.3, total);
}

void main()
{
  bool isWindow = false;
  if (fs_Col.z >= 0.5) {
    if (5.0 * (fs_Pos.x + fs_Pos.z) - floor(5.0 * (fs_Pos.x + fs_Pos.z)) <= 0.35 && fs_Nor.y <= EPSILON && 10.0 * fs_Pos.y - floor(10.0 * fs_Pos.y) <= 0.35) {
      out_Col = vec4(151.0 / 255.0, 193.0 / 255.0, 234.0 / 255.0, 1.0);
      isWindow = true;
    } else {
      float mediumTexture = mediumTexture(5.0 * fs_Pos.x, 5.0 * fs_Pos.y, 5.0 * fs_Pos.z);
      out_Col = vec4(vec3(165.0 / 255.0, 15.0 / 255.0, 45.0 / 255.0) * mediumTexture, 1.0);
    }
  } else if (fs_Col.y >= 0.5) {
    if (5.0 * (fs_Pos.x + fs_Pos.z) - floor(5.0 * (fs_Pos.x + fs_Pos.z)) <= 0.35 && fs_Nor.y <= EPSILON && 5.0 * fs_Pos.y - floor(5.0 * fs_Pos.y) <= 0.35) {
      out_Col = vec4(151.0 / 255.0, 193.0 / 255.0, 234.0 / 255.0, 1.0);
      isWindow = true;
    } else {
      float houseTexture = houseTexture(10.0 * fs_Pos);
      out_Col = vec4(vec3(255.0 / 255.0, 128.0 / 255.0, 0.0 / 255.0) * houseTexture * 2.25, 1.0);
    }
  } else {
    float skyscraperTexture = worleyNoise(vec2(5.0 * fs_Pos.x + 5.0 * fs_Pos.y, 5.0 * fs_Pos.y + 5.0 * fs_Pos.z)) * 3.0;
    out_Col = vec4(vec3(0.0 / 255.0, 191.0 / 255.0, 255.0 / 255.0) * skyscraperTexture, 1.0);
  }

  vec3 sunPos = vec3(0.0, -100.0, 0.0);

  vec3 lightVec = sunPos - fs_Pos;
  vec3 normal = fs_Nor.xyz;
  float diffuseTerm = dot(normalize(normal), normalize(lightVec));
  diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);
  float ambientTerm = 0.6;
  vec3 intensities = vec3(10.0, 10.0, 10.0);

  vec3 cameraPosition = u_Eye;
  vec3 view = normalize(fs_Pos - cameraPosition);
  vec3 light = normalize(fs_Pos - sunPos);
  float specularIntensity = dot(reflect(-light, normal), view);
  if (isWindow) {
    specularIntensity = pow(max(specularIntensity, 0.0), 50.0);
  } else {
    specularIntensity = pow(max(specularIntensity, 0.0), 10.0);
  }

  float attenuationFactor = 0.001;
  vec3 beforeSpecular = vec3(out_Col.x * intensities.x, out_Col.y * intensities.y, out_Col.z * intensities.z);
  float attenuation = 1.0 / (1.0 + attenuationFactor * pow(length(lightVec), 2.0));
  out_Col = vec4(ambientTerm * out_Col.xyz + beforeSpecular * attenuation * (diffuseTerm * out_Col.xyz + vec3(0.886, 0.345, 0.133) * specularIntensity), 1.0);

}
