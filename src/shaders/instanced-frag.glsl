#version 300 es
precision highp float;

in vec2 fs_Pos;
in vec4 fs_Col;

out vec4 out_Col;

void main()
{
  out_Col = fs_Col;
}
