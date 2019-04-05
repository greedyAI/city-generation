#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform int u_MapState;
uniform sampler2D u_Texture;

in vec2 fs_Pos;
out vec4 out_Col;

void main() {
  vec2 uv = vec2(0.5 * (fs_Pos.x + 1.0), 0.5 * (fs_Pos.y + 1.0));
  vec4 textureCol = texture(u_Texture, uv);
  float heightField = textureCol.x * 2.0;
  float populationDensity = textureCol.w * 2.0;
  if (heightField > 0.75) {
    out_Col = vec4(vec3(51.0 / 255.0, 153.0 / 255.0, 255.0 / 255.0) * (2.0 - heightField), 1.0);
  } else {
    vec3 heightCol = vec3(90.0 / 255.0, 77.0 / 255.0, 65.0 / 255.0) * (0.9 - heightField) * 3.0;
    vec3 popCol;
    if (populationDensity < 1.0) {
      popCol = mix(vec3(255.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0), vec3(255.0 / 255.0, 255.0 / 255.0, 0.0 / 255.0), populationDensity);
    } else {
      popCol = mix(vec3(255.0 / 255.0, 255.0 / 255.0, 0.0 / 255.0), vec3(255.0 / 255.0, 0.0 / 255.0, 0.0 / 255.0), populationDensity - 1.0);
    }
    if (u_MapState == 0) {
      out_Col = vec4(heightCol, 1.0);
    } else if (u_MapState == 1) {
      out_Col = vec4(popCol, 1.0);
    } else {
      out_Col = vec4(mix(heightCol, popCol, 0.5), 1.0);
    }
  }
}
