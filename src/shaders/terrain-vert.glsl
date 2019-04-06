#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform sampler2D u_Texture;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out float fs_heightField;
out vec3 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_Col;

#define SCALE 100.0

float bias(float b, float t) {
  return pow(t, log(b) / log(0.5));
}

void main() {
  fs_Pos = vec3(vs_Pos.x * SCALE, vs_Pos.y, vs_Pos.z * SCALE);
  fs_Nor = vs_Nor;
  fs_Col = vs_Col;

  vec2 uv = vec2(0.5 * (vs_Pos.x + 1.0), 0.5 * (vs_Pos.z + 1.0));
  vec4 textureCol = texture(u_Texture, uv);
  fs_heightField = textureCol.x * 2.0;
  //float populationDensity = textureCol.w * 2.0;
  if (fs_heightField > 0.75) {
    vec4 modelposition = vec4(vs_Pos.x * SCALE, 0.0, vs_Pos.z * SCALE, 1.0);
    modelposition = u_Model * modelposition;
    gl_Position = u_ViewProj * modelposition;
  } else {
    vec4 modelposition = vec4(vs_Pos.x * SCALE, -2.0, vs_Pos.z * SCALE, 1.0);
    modelposition = u_Model * modelposition;
    gl_Position = u_ViewProj * modelposition;
  }
}
