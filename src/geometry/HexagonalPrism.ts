import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class HexagonalPrism extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;

  offsets: Float32Array; // Data for bufTranslate
  rotations: Float32Array;
  scales: Float32Array;
  colors: Float32Array;

  constructor() {
    super(); // Call the constructor of the super class. This is required.
  }

  toRadians(degrees: number) {
    return degrees * Math.PI / 180;
  }

  create() {

    this.indices = new Uint32Array([0, 1, 2,
                                    0, 2, 3,
                                    0, 3, 4,
                                    0, 4, 5,
                                    6, 7, 8,
                                    6, 8, 9,
                                    10, 11, 12,
                                    10, 12, 13,
                                    10, 13, 14,
                                    10, 14, 15,
                                    16, 17, 18,
                                    16, 18, 19,
                                    20, 21, 22,
                                    20, 22, 23,
                                    24, 25, 26,
                                    24, 26, 27,
                                    28, 29, 30,
                                    28, 30, 31,
                                    32, 33, 34,
                                    32, 34, 35]);

    this.normals = new Float32Array([// Bottom face
                                        0, -1, 0, 0,
                                        0, -1, 0, 0,
                                        0, -1, 0, 0,
                                        0, -1, 0, 0,
                                        0, -1, 0, 0,
                                        0, -1, 0, 0,

                                        // Side 0
                                        1, 0, 0, 0,
                                        1, 0, 0, 0,
                                        1, 0, 0, 0,
                                        1, 0, 0, 0,

                                        // Top face
                                        0, 1, 0, 0,
                                        0, 1, 0, 0,
                                        0, 1, 0, 0,
                                        0, 1, 0, 0,
                                        0, 1, 0, 0,
                                        0, 1, 0, 0,

                                        // Side 1
                                        Math.cos(this.toRadians(60 * 1)), 0, Math.sin(this.toRadians(60 * 1)), 0,
                                        Math.cos(this.toRadians(60 * 1)), 0, Math.sin(this.toRadians(60 * 1)), 0,
                                        Math.cos(this.toRadians(60 * 1)), 0, Math.sin(this.toRadians(60 * 1)), 0,
                                        Math.cos(this.toRadians(60 * 1)), 0, Math.sin(this.toRadians(60 * 1)), 0,

                                        // Side 2
                                        Math.cos(this.toRadians(60 * 2)), 0, Math.sin(this.toRadians(60 * 2)), 0,
                                        Math.cos(this.toRadians(60 * 2)), 0, Math.sin(this.toRadians(60 * 2)), 0,
                                        Math.cos(this.toRadians(60 * 2)), 0, Math.sin(this.toRadians(60 * 2)), 0,
                                        Math.cos(this.toRadians(60 * 2)), 0, Math.sin(this.toRadians(60 * 2)), 0,

                                        // Side 3
                                        Math.cos(this.toRadians(60 * 3)), 0, Math.sin(this.toRadians(60 * 3)), 0,
                                        Math.cos(this.toRadians(60 * 3)), 0, Math.sin(this.toRadians(60 * 3)), 0,
                                        Math.cos(this.toRadians(60 * 3)), 0, Math.sin(this.toRadians(60 * 3)), 0,
                                        Math.cos(this.toRadians(60 * 3)), 0, Math.sin(this.toRadians(60 * 3)), 0,

                                        // Side 4
                                        Math.cos(this.toRadians(60 * 4)), 0, Math.sin(this.toRadians(60 * 4)), 0,
                                        Math.cos(this.toRadians(60 * 4)), 0, Math.sin(this.toRadians(60 * 4)), 0,
                                        Math.cos(this.toRadians(60 * 4)), 0, Math.sin(this.toRadians(60 * 4)), 0,
                                        Math.cos(this.toRadians(60 * 4)), 0, Math.sin(this.toRadians(60 * 4)), 0,

                                        // Side 5
                                        Math.cos(this.toRadians(60 * 5)), 0, Math.sin(this.toRadians(60 * 5)), 0,
                                        Math.cos(this.toRadians(60 * 5)), 0, Math.sin(this.toRadians(60 * 5)), 0,
                                        Math.cos(this.toRadians(60 * 5)), 0, Math.sin(this.toRadians(60 * 5)), 0,
                                        Math.cos(this.toRadians(60 * 5)), 0, Math.sin(this.toRadians(60 * 5)), 0]);

    this.positions = new Float32Array([// Bottom face
                                        Math.cos(this.toRadians(60 * 0 + 30)), -1, Math.sin(this.toRadians(60 * 0 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 1 + 30)), -1, Math.sin(this.toRadians(60 * 1 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 2 + 30)), -1, Math.sin(this.toRadians(60 * 2 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 3 + 30)), -1, Math.sin(this.toRadians(60 * 3 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 4 + 30)), -1, Math.sin(this.toRadians(60 * 4 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 5 + 30)), -1, Math.sin(this.toRadians(60 * 5 + 30)), 1,

                                        // Side 0
                                        Math.cos(this.toRadians(60 * 0 + 30)), 1, Math.sin(this.toRadians(60 * 0 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 0 + 30)), -1, Math.sin(this.toRadians(60 * 0 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 1 + 30)), -1, Math.sin(this.toRadians(60 * 1 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 1 + 30)), 1, Math.sin(this.toRadians(60 * 1 + 30)), 1,

                                        // Top face
                                        Math.cos(this.toRadians(60 * 0 + 30)), 1, Math.sin(this.toRadians(60 * 0 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 1 + 30)), 1, Math.sin(this.toRadians(60 * 1 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 2 + 30)), 1, Math.sin(this.toRadians(60 * 2 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 3 + 30)), 1, Math.sin(this.toRadians(60 * 3 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 4 + 30)), 1, Math.sin(this.toRadians(60 * 4 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 5 + 30)), 1, Math.sin(this.toRadians(60 * 5 + 30)), 1,

                                        // Side 1
                                        Math.cos(this.toRadians(60 * 1 + 30)), 1, Math.sin(this.toRadians(60 * 1 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 1 + 30)), -1, Math.sin(this.toRadians(60 * 1 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 2 + 30)), -1, Math.sin(this.toRadians(60 * 2 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 2 + 30)), 1, Math.sin(this.toRadians(60 * 2 + 30)), 1,

                                        // Side 2
                                        Math.cos(this.toRadians(60 * 2 + 30)), 1, Math.sin(this.toRadians(60 * 2 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 2 + 30)), -1, Math.sin(this.toRadians(60 * 2 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 3 + 30)), -1, Math.sin(this.toRadians(60 * 3 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 3 + 30)), 1, Math.sin(this.toRadians(60 * 3 + 30)), 1,

                                        // Side 3
                                        Math.cos(this.toRadians(60 * 3 + 30)), 1, Math.sin(this.toRadians(60 * 3 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 3 + 30)), -1, Math.sin(this.toRadians(60 * 3 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 4 + 30)), -1, Math.sin(this.toRadians(60 * 4 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 4 + 30)), 1, Math.sin(this.toRadians(60 * 4 + 30)), 1,

                                        // Side 4
                                        Math.cos(this.toRadians(60 * 4 + 30)), 1, Math.sin(this.toRadians(60 * 4 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 4 + 30)), -1, Math.sin(this.toRadians(60 * 4 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 5 + 30)), -1, Math.sin(this.toRadians(60 * 5 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 5 + 30)), 1, Math.sin(this.toRadians(60 * 5 + 30)), 1,

                                        // Side 5
                                        Math.cos(this.toRadians(60 * 5 + 30)), 1, Math.sin(this.toRadians(60 * 5 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 5 + 30)), -1, Math.sin(this.toRadians(60 * 5 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 0 + 30)), -1, Math.sin(this.toRadians(60 * 0 + 30)), 1,
                                        Math.cos(this.toRadians(60 * 0 + 30)), 1, Math.sin(this.toRadians(60 * 0 + 30)), 1]);

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

    console.log(`Created hexagonal prism`);
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

export default HexagonalPrism;
