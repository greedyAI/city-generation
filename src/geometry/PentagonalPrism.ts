import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class PentagonalPrism extends Drawable {
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
                                    5, 6, 7,
                                    5, 7, 8,
                                    9, 10, 11,
                                    9, 11, 12,
                                    9, 12, 13,
                                    14, 15, 16,
                                    14, 16, 17,
                                    18, 19, 20,
                                    18, 20, 21,
                                    22, 23, 24,
                                    22, 24, 25,
                                    26, 27, 28,
                                    26, 28, 29]);

    this.normals = new Float32Array([// Bottom face
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

                                        // Side 1
                                        Math.cos(this.toRadians(72 * 1)), 0, Math.sin(this.toRadians(72 * 1)), 0,
                                        Math.cos(this.toRadians(72 * 1)), 0, Math.sin(this.toRadians(72 * 1)), 0,
                                        Math.cos(this.toRadians(72 * 1)), 0, Math.sin(this.toRadians(72 * 1)), 0,
                                        Math.cos(this.toRadians(72 * 1)), 0, Math.sin(this.toRadians(72 * 1)), 0,

                                        // Side 2
                                        Math.cos(this.toRadians(72 * 2)), 0, Math.sin(this.toRadians(72 * 2)), 0,
                                        Math.cos(this.toRadians(72 * 2)), 0, Math.sin(this.toRadians(72 * 2)), 0,
                                        Math.cos(this.toRadians(72 * 2)), 0, Math.sin(this.toRadians(72 * 2)), 0,
                                        Math.cos(this.toRadians(72 * 2)), 0, Math.sin(this.toRadians(72 * 2)), 0,

                                        // Side 3
                                        Math.cos(this.toRadians(72 * 3)), 0, Math.sin(this.toRadians(72 * 3)), 0,
                                        Math.cos(this.toRadians(72 * 3)), 0, Math.sin(this.toRadians(72 * 3)), 0,
                                        Math.cos(this.toRadians(72 * 3)), 0, Math.sin(this.toRadians(72 * 3)), 0,
                                        Math.cos(this.toRadians(72 * 3)), 0, Math.sin(this.toRadians(72 * 3)), 0,

                                        // Side 4
                                        Math.cos(this.toRadians(72 * 4)), 0, Math.sin(this.toRadians(72 * 4)), 0,
                                        Math.cos(this.toRadians(72 * 4)), 0, Math.sin(this.toRadians(72 * 4)), 0,
                                        Math.cos(this.toRadians(72 * 4)), 0, Math.sin(this.toRadians(72 * 4)), 0,
                                        Math.cos(this.toRadians(72 * 4)), 0, Math.sin(this.toRadians(72 * 4)), 0]);

    this.positions = new Float32Array([// Bottom face
                                        Math.cos(this.toRadians(72 * 0 + 36)), -1, Math.sin(this.toRadians(72 * 0 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 1 + 36)), -1, Math.sin(this.toRadians(72 * 1 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 2 + 36)), -1, Math.sin(this.toRadians(72 * 2 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 3 + 36)), -1, Math.sin(this.toRadians(72 * 3 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 4 + 36)), -1, Math.sin(this.toRadians(72 * 4 + 36)), 1,

                                        // Side 0
                                        Math.cos(this.toRadians(72 * 0 + 36)), 1, Math.sin(this.toRadians(72 * 0 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 0 + 36)), -1, Math.sin(this.toRadians(72 * 0 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 1 + 36)), -1, Math.sin(this.toRadians(72 * 1 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 1 + 36)), 1, Math.sin(this.toRadians(72 * 1 + 36)), 1,

                                        // Top face
                                        Math.cos(this.toRadians(72 * 0 + 36)), 1, Math.sin(this.toRadians(72 * 0 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 1 + 36)), 1, Math.sin(this.toRadians(72 * 1 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 2 + 36)), 1, Math.sin(this.toRadians(72 * 2 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 3 + 36)), 1, Math.sin(this.toRadians(72 * 3 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 4 + 36)), 1, Math.sin(this.toRadians(72 * 4 + 36)), 1,

                                        // Side 1
                                        Math.cos(this.toRadians(72 * 1 + 36)), 1, Math.sin(this.toRadians(72 * 1 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 1 + 36)), -1, Math.sin(this.toRadians(72 * 1 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 2 + 36)), -1, Math.sin(this.toRadians(72 * 2 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 2 + 36)), 1, Math.sin(this.toRadians(72 * 2 + 36)), 1,

                                        // Side 2
                                        Math.cos(this.toRadians(72 * 2 + 36)), 1, Math.sin(this.toRadians(72 * 2 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 2 + 36)), -1, Math.sin(this.toRadians(72 * 2 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 3 + 36)), -1, Math.sin(this.toRadians(72 * 3 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 3 + 36)), 1, Math.sin(this.toRadians(72 * 3 + 36)), 1,

                                        // Side 3
                                        Math.cos(this.toRadians(72 * 3 + 36)), 1, Math.sin(this.toRadians(72 * 3 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 3 + 36)), -1, Math.sin(this.toRadians(72 * 3 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 4 + 36)), -1, Math.sin(this.toRadians(72 * 4 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 4 + 36)), 1, Math.sin(this.toRadians(72 * 4 + 36)), 1,

                                        // Side 4
                                        Math.cos(this.toRadians(72 * 4 + 36)), 1, Math.sin(this.toRadians(72 * 4 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 4 + 36)), -1, Math.sin(this.toRadians(72 * 4 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 0 + 36)), -1, Math.sin(this.toRadians(72 * 0 + 36)), 1,
                                        Math.cos(this.toRadians(72 * 0 + 36)), 1, Math.sin(this.toRadians(72 * 0 + 36)), 1]);

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

    console.log(`Created pentagonal prism`);
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

export default PentagonalPrism;
