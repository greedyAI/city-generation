#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.

in vec3 vs_Translate; // Another instance rendering attribute used to position each quad instance in the scene
in vec4 vs_Rotation;
in vec4 vs_Scale;
in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color

out vec3 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_Col;

#define SCALE 50.0

mat4 translationMatrix(vec4 t) {
  return mat4(
    1.0,0.0,0.0,0.0,
    0.0,1.0,0.0,0.0,
    0.0,0.0,1.0,0.0,
    t.x,t.y,t.z,1.0);
}

mat4 rotationMatrix(vec4 q) {
  float qx = q[0];
  float qy = q[1];
  float qz = q[2];
  float qw = q[3];

  return transpose(mat4(1.0f - 2.0f*qy*qy - 2.0f*qz*qz, 2.0f*qx*qy - 2.0f*qz*qw, 2.0f*qx*qz + 2.0f*qy*qw, 0.0f,
    2.0f*qx*qy + 2.0f*qz*qw, 1.0f - 2.0f*qx*qx - 2.0f*qz*qz, 2.0f*qy*qz - 2.0f*qx*qw, 0.0f,
    2.0f*qx*qz - 2.0f*qy*qw, 2.0f*qy*qz + 2.0f*qx*qw, 1.0f - 2.0f*qx*qx - 2.0f*qy*qy, 0.0f,
    0.0f, 0.0f, 0.0f, 1.0f));
}

mat4 scaleMatrix(vec4 s) {
  return mat4(
    s.x,0.0,0.0,0.0,
    0.0,s.y,0.0,0.0,
    0.0,0.0,s.z,0.0,
    0.0,0.0,0.0,1.0
  );
}

void main()
{
  fs_Col = vs_Col;
  fs_Nor = normalize(vec4(mat3(transpose(inverse(u_Model * translationMatrix(vec4(2.0 * vs_Translate, 1.0)) * rotationMatrix(vs_Rotation) * scaleMatrix(vs_Scale)))) * vec3(vs_Nor), 0.0f));

  vec4 modelposition = u_Model * vs_Pos;
  modelposition = vec4(modelposition[0] * vs_Scale[0], modelposition[1] * vs_Scale[1], modelposition[2] * vs_Scale[2], 1.0f);
  vec3 newPos = 2.0f * dot(vec3(vs_Rotation), vec3(modelposition)) * vec3(vs_Rotation) + (vs_Rotation[3] * vs_Rotation[3] - dot(vec3(vs_Rotation), vec3(vs_Rotation))) * vec3(modelposition) + 2.0f * vs_Rotation[3] * cross(vec3(vs_Rotation), vec3(modelposition)) + 2.0 * vs_Translate;
  modelposition = vec4(newPos.x * SCALE, -newPos.y - 2.1, newPos.z * SCALE, 1.0f);

  fs_Pos = modelposition.xyz;
  gl_Position = u_ViewProj * modelposition;
}
