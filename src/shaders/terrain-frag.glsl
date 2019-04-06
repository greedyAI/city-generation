#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform int u_MapState;
uniform sampler2D u_Texture;

in float fs_heightField;
in vec3 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_Col;

out vec4 out_Col;

void main() {
  if (fs_heightField > 0.75) {
    out_Col = vec4(vec3(51.0 / 255.0, 153.0 / 255.0, 255.0 / 255.0) * (2.0 - fs_heightField), 1.0);
  } else {
    out_Col = vec4(189.0 / 255.0, 183.0 / 255.0, 107.0 / 255.0, 1.0);
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
  specularIntensity = pow(max(specularIntensity, 0.0), 10.0);

  float attenuationFactor = 0.001;
  vec3 beforeSpecular = vec3(out_Col.x * intensities.x, out_Col.y * intensities.y, out_Col.z * intensities.z);
  float attenuation = 1.0 / (1.0 + attenuationFactor * pow(length(lightVec), 2.0));
  out_Col = vec4(ambientTerm * out_Col.xyz + beforeSpecular * attenuation * (diffuseTerm * out_Col.xyz + vec3(0.886, 0.345, 0.133) * specularIntensity), 1.0);
}
