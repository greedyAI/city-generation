import {vec2, vec3, vec4, mat3, mat4, quat} from 'gl-matrix';
import {gl} from './globals';

class Terrain {
  terrainTexture: Uint8Array;
  width: number;
  height: number;

  constructor(terrainTexture: Uint8Array, width: number, height: number) {
    this.terrainTexture = terrainTexture;
    this.width = width;
    this.height = height;
  }

  noise(p: vec3) {
    let val: number = Math.abs(Math.sin((p[0] * 10.0 + 100.0) * 987.654 + (p[1] * 10.0 + 100.0) * 123.456 + (p[2] * 10.0 + 100.0) * 531.975) * 85734.3545);
    return val - Math.floor(val);
  }

  noise2(p: vec3) {
    let val: number = Math.abs(Math.sin((p[0] * 10.0 - 100.0) * 456.789 + (p[1] * 10.0 - 100.0) * 654.321 + (p[2] * 10.0 - 100.0) * 579.135) * 54534.3758);
    return val - Math.floor(val);
  }

  heightField(pos: vec2) {
    let x: number = Math.floor((pos[0] + 1.0) * this.width / 2.0);
    x = Math.max(0.0, Math.min(x, this.width));
    let y: number = Math.floor((pos[1] + 1.0) * this.height / 2.0);
    y = Math.max(0.0, Math.min(y, this.height));

    let heightField = this.terrainTexture[y * this.width * 4 + x * 4] * 2.0 / 255.0;
    if (heightField > 0.75) {
      return 0;
    } else {
      return 0.75 - heightField;
    }
  }

  populationDensity(pos: vec2) {
    let x: number = Math.floor((pos[0] + 1.0) * this.width / 2.0);
    x = Math.max(0.0, Math.min(x, this.width));
    let y: number = Math.floor((pos[1] + 1.0) * this.height / 2.0);
    y = Math.max(0.0, Math.min(y, this.height));

    let heightField = this.terrainTexture[y * this.width * 4 + x * 4] * 2.0 / 255.0;
    let populationDensity = this.terrainTexture[y * this.width * 4 + x * 4 + 3] * 2.0 / 255.0;
    if (heightField > 0.75) {
      return 0;
    } else {
      return populationDensity;
    }
  }
}

export default Terrain;
