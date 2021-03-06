import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  offsets: Float32Array; // Data for bufTranslate
  rotations: Float32Array;
  scales: Float32Array;
  colors: Float32Array;

  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }

  create() {

    this.indices = new Uint32Array([0, 1, 2,
                                    0, 2, 3,
                                    4, 5, 6,
                                    4, 6, 7,
                                    8, 9, 10,
                                    8, 10, 11,
                                    12, 13, 14,
                                    12, 14, 15,
                                    16, 17, 18,
                                    16, 18, 19,
                                    20, 21, 22,
                                    20, 22, 23]);

    this.normals = new Float32Array([// Bottom face
                                        0, 0, -1, 0,
                                        0, 0, -1, 0,
                                        0, 0, -1, 0,
                                        0, 0, -1, 0,

                                        // Right face
                                        1, 0, 0, 0,
                                        1, 0, 0, 0,
                                        1, 0, 0, 0,
                                        1, 0, 0, 0,

                                        // Top face
                                        0, 0, 1, 0,
                                        0, 0, 1, 0,
                                        0, 0, 1, 0,
                                        0, 0, 1, 0,

                                        // Left face
                                        -1, 0, 0, 0,
                                        -1, 0, 0, 0,
                                        -1, 0, 0, 0,
                                        -1, 0, 0, 0,

                                        // Front face
                                        0, 1, 0, 0,
                                        0, 1, 0, 0,
                                        0, 1, 0, 0,
                                        0, 1, 0, 0,

                                        // Back face
                                        0, -1, 0, 0,
                                        0, -1, 0, 0,
                                        0, -1, 0, 0,
                                        0, -1, 0, 0]);

    this.positions = new Float32Array([// Bottom face
                                        -1, -1, -1, 1,
                                        1, -1, -1, 1,
                                        1, 1, -1, 1,
                                        -1, 1, -1, 1,

                                        // Right face
                                        1, -1, 1, 1,
                                        1, -1, -1, 1,
                                        1, 1, -1, 1,
                                        1, 1, 1, 1,

                                        // Top face
                                        1, -1, 1, 1,
                                        -1, -1, 1, 1,
                                        -1, 1, 1, 1,
                                        1, 1, 1, 1,

                                        // Left face
                                        -1, -1, -1, 1,
                                        -1, -1, 1, 1,
                                        -1, 1, 1, 1,
                                        -1, 1, -1, 1,

                                        // Front face
                                        -1, 1, 1, 1,
                                        1, 1, 1, 1,
                                        1, 1, -1, 1,
                                        -1, 1, -1, 1,

                                        // Back face
                                        -1, -1, 1, 1,
                                        1, -1, 1, 1,
                                        1, -1, -1, 1,
                                        -1, -1, -1, 1]);

    for (var i = 0; i < this.positions.length; i++) {
      if (i % 4 == 0) {
        this.positions[i] += this.center[0];
      } else if (i % 4 == 1) {
        this.positions[i] += this.center[1];
      } else if (i % 4 == 2) {
        this.positions[i] += this.center[2];
      }
    }

    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.generateTranslate();
    this.generateRotation();
    this.generateScale();
    this.generateCol();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created cube`);
  }

  setInstanceVBOs(offsets: Float32Array, rotations: Float32Array, scales: Float32Array, colors: Float32Array) {
    this.offsets = offsets;
    this.rotations = rotations;
    this.scales = scales;
    this.colors = colors;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslate);
    gl.bufferData(gl.ARRAY_BUFFER, this.offsets, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufRotation);
    gl.bufferData(gl.ARRAY_BUFFER, this.rotations, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufScale);
    gl.bufferData(gl.ARRAY_BUFFER, this.scales, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
  }
};

export default Cube;
