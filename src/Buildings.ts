import {glMatrix, vec2, vec3, vec4, mat3, mat4, quat} from 'gl-matrix';
import Drawable from './rendering/gl/Drawable';
import {gl} from './globals';
import Terrain from './Terrain';
import {RoadNetwork, Edge} from './RoadNetwork';

class Buildings {
  upVector: vec3 = vec3.fromValues(0,1,0);
  buildingWidth: number;
  houseWidth: number;
  mediumWidth: number;
  rasterizedGrid: any;
  houseGrid: any;
  mediumGrid: any;
  roadNetwork: RoadNetwork;

  cubeTranslate: number[] = [];
  cubeRotate: number[] = [];
  cubeScale: number[] = [];
  cubeColor: number[] = [];
  cubeCount: number = 0;

  pentagonTranslate: number[] = [];
  pentagonRotate: number[] = [];
  pentagonScale: number[] = [];
  pentagonColor: number[] = [];
  pentagonCount: number = 0;

  hexagonTranslate: number[] = [];
  hexagonRotate: number[] = [];
  hexagonScale: number[] = [];
  hexagonColor: number[] = [];
  hexagonCount: number = 0;

  constructor(rasterizedGrid: any, houseGrid: any, mediumGrid: any, roadNetwork: RoadNetwork, buildingWidth: number, houseWidth: number, mediumWidth: number) {
    this.rasterizedGrid = rasterizedGrid;
    this.houseGrid = houseGrid;
    this.mediumGrid = mediumGrid;
    this.roadNetwork = roadNetwork;
    this.buildingWidth = buildingWidth;
    this.houseWidth = houseWidth;
    this.mediumWidth = mediumWidth;
  }

  noise(p: vec3) {
    let val: number = Math.abs(Math.sin((p[0] * 10.0 + 300.0) * 654.987 + (p[1] * 10.0 + 300.0) * 456.123 + (p[2] * 10.0 + 300.0) * 975.531) * 43545.8573);
    return val - Math.floor(val);
  }

  noise2(p: vec3) {
    let val: number = Math.abs(Math.sin((p[0] * 10.0 + 500.0) * 789.456 + (p[1] * 10.0 + 500.0) * 321.654 + (p[2] * 10.0 + 500.0) * 135.579) * 37585.4534);
    return val - Math.floor(val);
  }

  rotate(axisOfRotation: vec3, angle: number) {
    let quaternion: quat = quat.create();
    let newOrientation: vec4 = vec4.fromValues(0,1,0,0);
    vec3.normalize(axisOfRotation, axisOfRotation);
    quat.setAxisAngle(quaternion, axisOfRotation, angle);
    quat.normalize(quaternion, quaternion);
    vec4.transformQuat(newOrientation, newOrientation, quaternion);
    let orientation: vec3 = vec3.fromValues(newOrientation[0], newOrientation[1], newOrientation[2]);
    vec3.normalize(orientation, orientation);
    return orientation;
  }

  createBuildings() {
    let sqrt2: number = Math.sqrt(2);
    let height: number = this.rasterizedGrid.length;
    let width: number = this.rasterizedGrid[0].length;
    for (let i: number = 0; i < height; i++) {
      for (let j: number = 0; j < width; j++) {
        if (this.rasterizedGrid[i][j] == 2) {
          let coords: vec2 = vec2.fromValues(2 * (i + 0.5) / height - 1, 2 * (j + 0.5) / width - 1);
          let popDensity: number = this.roadNetwork.terrain.populationDensity(coords);
          let currentHeight: number = popDensity * popDensity * 1.5;
          let vertices: any = new Array();
          let verticesUsed: any = new Set();
          let currentAngle: number = this.roadNetwork.terrain.noise(vec3.fromValues(coords[0], currentHeight, coords[1])) * 2 * Math.PI;
          let currentBuilding: number = this.roadNetwork.terrain.noise2(vec3.fromValues(coords[0], currentHeight, coords[1])) * 3;
          let randomVertexOffset: vec2 = vec2.create();
          let initialSides: number = 0;

          if (currentHeight >= 3) {
            while (currentHeight > 0) {
              if (currentBuilding > 2) {
                if (initialSides == 0) {
                  initialSides = 4;
                }
                let quaternion: quat = quat.fromValues(0,0,0,1);
                quat.rotationTo(quaternion, this.upVector, this.rotate(vec3.fromValues(0,1,0), currentAngle));
                quat.normalize(quaternion, quaternion);
                this.cubeTranslate.push(coords[0] + randomVertexOffset[0], currentHeight / 2, coords[1] + randomVertexOffset[1]);
                this.cubeRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
                this.cubeScale.push(this.buildingWidth / sqrt2, currentHeight, this.buildingWidth / sqrt2, 1);
                this.cubeColor.push(1,0,0,1);
                this.cubeCount += 1
                for (let k: number = 0; k < 4; k++) {
                  let a: number = glMatrix.toRadian(90 * k + 45);
                  vertices.push(vec2.fromValues(randomVertexOffset[0] + this.buildingWidth * Math.cos(a) / sqrt2, randomVertexOffset[1] + this.buildingWidth * Math.sin(a) / sqrt2));
                }
              } else if (currentBuilding > 1) {
                if (initialSides == 0) {
                  initialSides = 5;
                }
                let quaternion: quat = quat.fromValues(0,0,0,1);
                quat.rotationTo(quaternion, this.upVector, this.rotate(vec3.fromValues(0,1,0), currentAngle));
                quat.normalize(quaternion, quaternion);
                this.pentagonTranslate.push(coords[0] + randomVertexOffset[0], currentHeight / 2, coords[1] + randomVertexOffset[1]);
                this.pentagonRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
                this.pentagonScale.push(this.buildingWidth, currentHeight, this.buildingWidth, 1);
                this.pentagonColor.push(1,0,0,1);
                this.pentagonCount += 1
                for (let k: number = 0; k < 5; k++) {
                  let a: number = glMatrix.toRadian(72 * k + 36);
                  vertices.push(vec2.fromValues(randomVertexOffset[0] + this.buildingWidth * Math.cos(a), randomVertexOffset[1] + this.buildingWidth * Math.sin(a)));
                }
              } else {
                if (initialSides == 0) {
                  initialSides = 6;
                }
                let quaternion: quat = quat.fromValues(0,0,0,1);
                quat.rotationTo(quaternion, this.upVector, this.rotate(vec3.fromValues(0,1,0), currentAngle));
                quat.normalize(quaternion, quaternion);
                this.hexagonTranslate.push(coords[0] + randomVertexOffset[0], currentHeight / 2, coords[1] + randomVertexOffset[1]);
                this.hexagonRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
                this.hexagonScale.push(this.buildingWidth, currentHeight, this.buildingWidth, 1);
                this.hexagonColor.push(1,0,0,1);
                this.hexagonCount += 1
                for (let k: number = 0; k < 6; k++) {
                  let a: number = glMatrix.toRadian(60 * k + 30);
                  vertices.push(vec2.fromValues(randomVertexOffset[0] + this.buildingWidth * Math.cos(a), randomVertexOffset[1] + this.buildingWidth * Math.sin(a)));
                }
              }
              currentHeight -= (this.noise(vec3.fromValues(coords[0], currentHeight, coords[1])) + 3);
              currentAngle = this.roadNetwork.terrain.noise(vec3.fromValues(coords[0], currentHeight, coords[1])) * 2 * Math.PI;
              currentBuilding = this.roadNetwork.terrain.noise2(vec3.fromValues(coords[0], currentHeight, coords[1])) * 3;
              if (currentHeight < 1) {
                break;
              }
              let continueDownwards: boolean = false;
              for (let k: number = vertices.length - 1; k >= 0; k--) {
                randomVertexOffset = vertices[k];
                let newI: number = Math.round((coords[0] + randomVertexOffset[0] + 1) * height / 2 - 0.5);
                let newJ: number = Math.round((coords[1] + randomVertexOffset[1] + 1) * width / 2 - 0.5);
                if (newI >= 0 && newI < height && newJ >= 0 && newJ < width) {
                  if (this.rasterizedGrid[newI][newJ] >= 1 && !verticesUsed.has(randomVertexOffset)) {
                    if (initialSides == 4 && vec2.length(randomVertexOffset) >= this.buildingWidth / sqrt2 || initialSides != 4 && vec2.length(randomVertexOffset) >= this.buildingWidth) {
                      verticesUsed.add(randomVertexOffset);
                      continueDownwards = true;
                      break;
                    }
                  }
                }
              }
              if (!continueDownwards) {
                break;
              }
            }
          }
        }
      }
    }

    height = this.houseGrid.length;
    width = this.houseGrid[0].length;
    for (let i: number = 0; i < height; i++) {
      for (let j: number = 0; j < width; j++) {
        if (this.houseGrid[i][j] == 1) {
          let coords: vec2 = vec2.fromValues(2 * (i + 0.5) / height - 1, 2 * (j + 0.5) / width - 1);
          let popDensity: number = this.roadNetwork.terrain.populationDensity(coords);
          let currentHeight: number = Math.floor(popDensity * popDensity * 2.5);
          let currentAngle: number = this.roadNetwork.terrain.noise(vec3.fromValues(coords[0], currentHeight, coords[1])) * 2 * Math.PI;

          if (popDensity > 0.5 && popDensity < 1) {
            currentHeight = 1 / 6;
            let quaternion: quat = quat.fromValues(0,0,0,1);
            quat.rotationTo(quaternion, this.upVector, this.rotate(vec3.fromValues(0,1,0), currentAngle));
            quat.normalize(quaternion, quaternion);
            this.cubeTranslate.push(coords[0], currentHeight / 2, coords[1]);
            this.cubeRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            this.cubeScale.push(2 * this.houseWidth / sqrt2, currentHeight, this.houseWidth / sqrt2, 1);
            this.cubeColor.push(0,1,0,1);
            this.cubeCount += 1
          }
        }
      }
    }

    height = this.mediumGrid.length;
    width = this.mediumGrid[0].length;
    for (let i: number = 0; i < height; i++) {
      for (let j: number = 0; j < width; j++) {
        if (this.mediumGrid[i][j] == 2) {
          let coords: vec2 = vec2.fromValues(2 * (i + 0.5) / height - 1, 2 * (j + 0.5) / width - 1);
          let popDensity: number = this.roadNetwork.terrain.populationDensity(coords);
          let currentHeight: number = popDensity * popDensity * 2;
          let vertices: any = new Array();
          let verticesUsed: any = new Set();
          let currentAngle: number = this.roadNetwork.terrain.noise(vec3.fromValues(coords[0], currentHeight, coords[1])) * 2 * Math.PI;
          let currentBuilding: number = this.roadNetwork.terrain.noise2(vec3.fromValues(coords[0], currentHeight, coords[1])) * 3;
          let randomVertexOffset: vec2 = vec2.create();
          let initialSides: number = 0;

          if (currentHeight >= 2 && currentHeight <= 4) {
            currentHeight /= 2;
            while (currentHeight > 0) {
              if (currentBuilding > 2) {
                if (initialSides == 0) {
                  initialSides = 4;
                }
                let quaternion: quat = quat.fromValues(0,0,0,1);
                quat.rotationTo(quaternion, this.upVector, this.rotate(vec3.fromValues(0,1,0), currentAngle));
                quat.normalize(quaternion, quaternion);
                this.cubeTranslate.push(coords[0] + randomVertexOffset[0], currentHeight / 2, coords[1] + randomVertexOffset[1]);
                this.cubeRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
                this.cubeScale.push(2 * this.mediumWidth / sqrt2, currentHeight, this.mediumWidth / sqrt2, 1);
                this.cubeColor.push(0,0,1,1);
                this.cubeCount += 1
                for (let k: number = 0; k < 4; k++) {
                  let a: number = glMatrix.toRadian(90 * k + 45);
                  vertices.push(vec2.fromValues(randomVertexOffset[0] + this.mediumWidth * Math.cos(a) / sqrt2, randomVertexOffset[1] + this.mediumWidth * Math.sin(a) / sqrt2));
                }
              } else if (currentBuilding > 1) {
                if (initialSides == 0) {
                  initialSides = 5;
                }
                let quaternion: quat = quat.fromValues(0,0,0,1);
                quat.rotationTo(quaternion, this.upVector, this.rotate(vec3.fromValues(0,1,0), currentAngle));
                quat.normalize(quaternion, quaternion);
                this.pentagonTranslate.push(coords[0] + randomVertexOffset[0], currentHeight / 2, coords[1] + randomVertexOffset[1]);
                this.pentagonRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
                this.pentagonScale.push(this.mediumWidth, currentHeight, this.mediumWidth, 1);
                this.pentagonColor.push(0,0,1,1);
                this.pentagonCount += 1
                for (let k: number = 0; k < 5; k++) {
                  let a: number = glMatrix.toRadian(72 * k + 36);
                  vertices.push(vec2.fromValues(randomVertexOffset[0] + this.mediumWidth * Math.cos(a), randomVertexOffset[1] + this.mediumWidth * Math.sin(a)));
                }
              } else {
                if (initialSides == 0) {
                  initialSides = 6;
                }
                let quaternion: quat = quat.fromValues(0,0,0,1);
                quat.rotationTo(quaternion, this.upVector, this.rotate(vec3.fromValues(0,1,0), currentAngle));
                quat.normalize(quaternion, quaternion);
                this.hexagonTranslate.push(coords[0] + randomVertexOffset[0], currentHeight / 2, coords[1] + randomVertexOffset[1]);
                this.hexagonRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
                this.hexagonScale.push(this.mediumWidth, currentHeight, this.mediumWidth, 1);
                this.hexagonColor.push(0,0,1,1);
                this.hexagonCount += 1
                for (let k: number = 0; k < 6; k++) {
                  let a: number = glMatrix.toRadian(60 * k + 30);
                  vertices.push(vec2.fromValues(randomVertexOffset[0] + this.mediumWidth * Math.cos(a), randomVertexOffset[1] + this.mediumWidth * Math.sin(a)));
                }
              }
              currentHeight -= (this.noise(vec3.fromValues(coords[0], currentHeight, coords[1])) + 1);
              currentAngle = this.roadNetwork.terrain.noise(vec3.fromValues(coords[0], currentHeight, coords[1])) * 2 * Math.PI;
              currentBuilding = this.roadNetwork.terrain.noise2(vec3.fromValues(coords[0], currentHeight, coords[1])) * 3;
              if (currentHeight < 0.5) {
                break;
              }
              let continueDownwards: boolean = false;
              for (let k: number = vertices.length - 1; k >= 0; k--) {
                randomVertexOffset = vertices[k];
                let newI: number = Math.round((coords[0] + randomVertexOffset[0] + 1) * height / 2 - 0.5);
                let newJ: number = Math.round((coords[1] + randomVertexOffset[1] + 1) * width / 2 - 0.5);
                if (newI >= 0 && newI < height && newJ >= 0 && newJ < width) {
                  if (this.mediumGrid[newI][newJ] >= 1 && !verticesUsed.has(randomVertexOffset)) {
                    if (initialSides == 4 && vec2.length(randomVertexOffset) >= this.mediumWidth / sqrt2 || initialSides != 4 && vec2.length(randomVertexOffset) >= this.mediumWidth) {
                      verticesUsed.add(randomVertexOffset);
                      continueDownwards = true;
                      break;
                    }
                  }
                }
              }
              if (!continueDownwards) {
                break;
              }
            }
          }
        }
      }
    }

  }
}

export default Buildings;
