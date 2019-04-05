import {vec2, vec3, vec4, mat3, mat4, quat} from 'gl-matrix';
import Drawable from './rendering/gl/Drawable';
import {gl} from './globals';
import Turtle from './Turtle';
import Terrain from './Terrain'

class RoadNetwork {
  upVector: vec3 = vec3.fromValues(0,1,0);
  root: vec2;
  checkered: boolean;
  highwayDensity: number;
  streetDensity: number;
  highwayThreshold: number;
  terrain: Terrain;

  highwayDimensions: vec3;
  highwayEdges: any;
  highwayIntersections: any;

  streetEdges: any; // superset of highwayEdges
  streetIntersections: any; // superset of highwayIntersections

  highwayTranslate: number[] = [];
  highwayRotate: number[] = [];
  highwayScale: number[] = [];
  highwayColor: number[] = [];
  highwayCount: number = 0;

  streetTranslate: number[] = [];
  streetRotate: number[] = [];
  streetScale: number[] = [];
  streetColor: number[] = [];
  streetCount: number = 0;

  constructor(checkered: boolean, highwayDensity: number, streetDensity: number, highwayThreshold: number, randomSeed: number, terrainTexture: Uint8Array, width: number, height: number) {
    this.terrain = new Terrain(terrainTexture, width, height);
    let randX: number = this.terrain.noise(vec3.fromValues(0.0 + randomSeed, 0.0 + randomSeed, 0.0 + randomSeed)) - 0.5;
    let lowestY: number = -1.0;
    while (true) {
      if (this.terrain.heightField(vec2.fromValues(randX, lowestY)) > 0) {
        break;
      }
      lowestY += 1.0 / height;
    }
    this.root = vec2.fromValues(randX, lowestY);
    this.checkered = checkered;
    this.highwayDensity = highwayDensity;
    this.streetDensity = streetDensity;
    this.highwayThreshold = highwayThreshold;

    this.highwayDimensions = vec3.fromValues(0.008, 0.2 / this.highwayDensity, 0.0);
    this.highwayEdges = new Array(Math.ceil(0.4 / this.highwayDimensions[1]) * Math.ceil(0.4 / this.highwayDimensions[1]));
    for (let i: number = 0; i < this.highwayEdges.length; i++) {
      this.highwayEdges[i] = new Array();
    }
    this.highwayIntersections = new Array(Math.ceil(0.4 / this.highwayDimensions[1]) * Math.ceil(0.4 / this.highwayDimensions[1]));
    for (let i: number = 0; i < this.highwayIntersections.length; i++) {
      this.highwayIntersections[i] = new Array();
    }
    this.streetEdges = new Array(Math.ceil(0.4 / this.highwayDimensions[1]) * Math.ceil(0.4 / this.highwayDimensions[1]));
    for (let i: number = 0; i < this.streetEdges.length; i++) {
      this.streetEdges[i] = new Array();
    }
    this.streetIntersections = new Array(Math.ceil(0.4 / this.highwayDimensions[1]) * Math.ceil(0.4 / this.highwayDimensions[1]));
    for (let i: number = 0; i < this.streetIntersections.length; i++) {
      this.streetIntersections[i] = new Array();
    }
  }

  createNetwork() {
    let turtles: Turtle[] = [];
    let roadTurtles: Turtle[] = [];
    let rootCopy: vec3 = vec3.fromValues(this.root[0], this.root[1], 0.999);
    turtles.push(new Turtle(rootCopy, vec3.fromValues(0,1,0), this.highwayDimensions, 0));
    let currentTurtle: Turtle = turtles[0];
    while (currentTurtle != null) {
      let rotate1Positive: boolean = false;
      let newTurtle1: Turtle = currentTurtle.copy();
      newTurtle1.depth += 1;
      let rotate1: number = 150 * this.terrain.noise(currentTurtle.position) - 75;
      if (rotate1 > 0) {
        rotate1 += 15;
        rotate1Positive = true;
      } else {
        rotate1 -= 15;
      }
      if (this.checkered) {
        rotate1 = 90;
      }
      newTurtle1.rotate(vec3.fromValues(0,0,1), rotate1);
      newTurtle1.move();
      if (this.terrain.populationDensity(vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1])) > this.highwayThreshold) {
        let target: vec2 = vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1]);
        newTurtle1.moveBack();

        let newEdge: Edge = new Edge(vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1]), target);

        let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
        let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
        let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);

        if (x >= 0 && x < k && y >= 0 && y < k) {
          let nearestEdge: Edge = undefined;
          let nearestDist: number = this.highwayDimensions[1] * 8;
          let proposedEndpoint: vec2 = undefined;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.highwayEdges[index].length; m++) {
                let otherEdge: Edge = this.highwayEdges[index][m];
                if (newEdge.intersectsWith(otherEdge) != undefined) {
                  let intersection: vec2 = newEdge.intersectsWith(otherEdge);
                  let dist: number = vec2.distance(newEdge.start, intersection);
                  if (dist < nearestDist && dist >= 0.0001) {
                    nearestEdge = otherEdge;
                    nearestDist = dist;
                    proposedEndpoint = intersection;
                  }
                } else {
                  let extended: vec2 = vec2.create();
                  vec2.subtract(extended, newEdge.target, newEdge.start);
                  vec2.scale(extended, extended, 1.5);
                  vec2.add(extended, extended, newEdge.start);
                  let extendedEdge: Edge = new Edge(vec2.clone(newEdge.start), extended);
                  if (extendedEdge.intersectsWith(otherEdge) != undefined) {
                    let intersection: vec2 = extendedEdge.intersectsWith(otherEdge);
                    let dist: number = vec2.distance(extendedEdge.start, intersection);
                    if (dist < nearestDist && dist >= 0.0001) {
                      nearestEdge = otherEdge;
                      nearestDist = dist;
                      proposedEndpoint = intersection;
                    }
                  }
                }
              }
            }
          }
          let noIntersectionNeeded: boolean = false;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.highwayIntersections[index].length; m++) {
                let otherIntersection: vec2 = this.highwayIntersections[index][m];
                if (proposedEndpoint != undefined) {
                  let dist: number = vec2.distance(otherIntersection, proposedEndpoint);
                  if (dist < this.highwayDimensions[1] * 0.5 && dist < nearestDist && dist >= 0.0001) {
                    nearestDist = dist;
                    proposedEndpoint = otherIntersection;
                    noIntersectionNeeded = true;
                  }
                }
              }
            }
          }

          let overlappingEdge: boolean = false;
          if (proposedEndpoint != undefined) {
            let direction: vec2 = vec2.create();
            vec2.subtract(direction, proposedEndpoint, vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1]));
            if (vec2.length(direction) < 0.0001) {
              overlappingEdge = true;
            } else {
              let normalized: vec2 = vec2.create();
              vec2.normalize(normalized, direction);
              newTurtle1.orientation = vec3.fromValues(normalized[0], normalized[1], 0);
              newTurtle1.scale[1] = vec2.length(direction);
            }
          }

          if (!overlappingEdge) {
            let quaternion: quat = quat.fromValues(0,0,0,1);
            quat.rotationTo(quaternion, this.upVector, newTurtle1.orientation);
            quat.normalize(quaternion, quaternion);
            this.highwayTranslate.push(newTurtle1.position[0] + 0.5 * newTurtle1.scale[1] * newTurtle1.orientation[0], newTurtle1.position[1] + 0.5 * newTurtle1.scale[1] * newTurtle1.orientation[1], 0);
            this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            this.highwayScale.push(newTurtle1.scale[0], newTurtle1.scale[1], newTurtle1.scale[2], 1);
            this.highwayColor.push(0,0,0,1);
            this.highwayCount += 1
            if (proposedEndpoint != undefined) {
              newEdge = new Edge(vec2.clone(newEdge.start), proposedEndpoint);
              this.highwayEdges[x * k + y].push(newEdge);
              this.streetEdges[x * k + y].push(newEdge);
              if (!noIntersectionNeeded) {
                let intersectionX: number = Math.floor((proposedEndpoint[0] + 1.0) * k / 2.0);
                let intersectionY: number = Math.floor((proposedEndpoint[1] + 1.0) * k / 2.0);
                if (intersectionX >= 0 && intersectionX < k && intersectionY >= 0 && intersectionY < k) {
                  this.highwayIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                  this.streetIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                }
              }
            } else {
              this.highwayEdges[x * k + y].push(newEdge);
              this.streetEdges[x * k + y].push(newEdge);
              newTurtle1.move();
              turtles.push(newTurtle1);
            }
          }
        }
      } else {
        if (this.terrain.heightField(vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1])) <= 0) {
          newTurtle1.move();
          if (this.terrain.heightField(vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1])) > 0) {
            let target: vec2 = vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1]);
            newTurtle1.moveBack();
            newTurtle1.moveBack();

            let newEdge: Edge = new Edge(vec2.fromValues(newTurtle1.position[0], newTurtle1.position[1]), target);

            let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
            let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
            let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);

            if (x >= 0 && x < k && y >= 0 && y < k) {
              let quaternion: quat = quat.fromValues(0,0,0,1);
              quat.rotationTo(quaternion, this.upVector, newTurtle1.orientation);
              quat.normalize(quaternion, quaternion);
              this.highwayTranslate.push(newTurtle1.position[0] + newTurtle1.scale[1] * newTurtle1.orientation[0], newTurtle1.position[1] + newTurtle1.scale[1] * newTurtle1.orientation[1], 0);
              this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
              this.highwayScale.push(newTurtle1.scale[0], 2 * newTurtle1.scale[1], newTurtle1.scale[2], 1);
              this.highwayColor.push(0,0,0,1);
              this.highwayCount += 1
              this.highwayEdges[x * k + y].push(newEdge);
              this.streetEdges[x * k + y].push(newEdge);
              newTurtle1.move();
              newTurtle1.move();
              turtles.push(newTurtle1);
            }
          }
        }
      }

      let newTurtle2: Turtle = currentTurtle.copy();
      newTurtle2.depth += 1;
      let rotate2: number = 150 * this.terrain.noise2(currentTurtle.position) - 75;
      if (rotate2 > 0) {
        rotate2 += 15;
      } else {
        rotate2 -= 15;
      }
      if (rotate1Positive) {
        rotate2 = -Math.abs(rotate2);
      } else {
        rotate2 = Math.abs(rotate2);
      }
      if (this.checkered) {
        rotate2 = -90;
      }
      newTurtle2.rotate(vec3.fromValues(0,0,1), rotate2);
      newTurtle2.move();
      if (this.terrain.populationDensity(vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1])) > this.highwayThreshold) {
        let target: vec2 = vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1]);
        newTurtle2.moveBack();

        let newEdge: Edge = new Edge(vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1]), target);

        let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
        let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
        let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);

        if (x >= 0 && x < k && y >= 0 && y < k) {
          let nearestEdge: Edge = undefined;
          let nearestDist: number = this.highwayDimensions[1] * 8;
          let proposedEndpoint: vec2 = undefined;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.highwayEdges[index].length; m++) {
                let otherEdge: Edge = this.highwayEdges[index][m];
                if (newEdge.intersectsWith(otherEdge) != undefined) {
                  let intersection: vec2 = newEdge.intersectsWith(otherEdge);
                  let dist: number = vec2.distance(newEdge.start, intersection);
                  if (dist < nearestDist && dist >= 0.0001) {
                    nearestEdge = otherEdge;
                    nearestDist = dist;
                    proposedEndpoint = intersection;
                  }
                } else {
                  let extended: vec2 = vec2.create();
                  vec2.subtract(extended, newEdge.target, newEdge.start);
                  vec2.scale(extended, extended, 1.5);
                  vec2.add(extended, extended, newEdge.start);
                  let extendedEdge: Edge = new Edge(vec2.clone(newEdge.start), extended);
                  if (extendedEdge.intersectsWith(otherEdge) != undefined) {
                    let intersection: vec2 = extendedEdge.intersectsWith(otherEdge);
                    let dist: number = vec2.distance(extendedEdge.start, intersection);
                    if (dist < nearestDist && dist >= 0.0001) {
                      nearestEdge = otherEdge;
                      nearestDist = dist;
                      proposedEndpoint = intersection;
                    }
                  }
                }
              }
            }
          }
          let noIntersectionNeeded: boolean = false;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.highwayIntersections[index].length; m++) {
                let otherIntersection: vec2 = this.highwayIntersections[index][m];
                if (proposedEndpoint != undefined) {
                  let dist: number = vec2.distance(otherIntersection, proposedEndpoint);
                  if (dist < this.highwayDimensions[1] * 0.5 && dist < nearestDist && dist >= 0.0001) {
                    nearestDist = dist;
                    proposedEndpoint = otherIntersection;
                    noIntersectionNeeded = true;
                  }
                }
              }
            }
          }

          let overlappingEdge: boolean = false;
          if (proposedEndpoint != undefined) {
            let direction: vec2 = vec2.create();
            vec2.subtract(direction, proposedEndpoint, vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1]));
            if (vec2.length(direction) < 0.0001) {
              overlappingEdge = true;
            } else {
              let normalized: vec2 = vec2.create();
              vec2.normalize(normalized, direction);
              newTurtle2.orientation = vec3.fromValues(normalized[0], normalized[1], 0);
              newTurtle2.scale[1] = vec2.length(direction);
            }
          }

          if (!overlappingEdge) {

            let quaternion: quat = quat.fromValues(0,0,0,1);
            quat.rotationTo(quaternion, this.upVector, newTurtle2.orientation);
            quat.normalize(quaternion, quaternion);
            this.highwayTranslate.push(newTurtle2.position[0] + 0.5 * newTurtle2.scale[1] * newTurtle2.orientation[0], newTurtle2.position[1] + 0.5 * newTurtle2.scale[1] * newTurtle2.orientation[1], 0);
            this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            this.highwayScale.push(newTurtle2.scale[0], newTurtle2.scale[1], newTurtle2.scale[2], 1);
            this.highwayColor.push(0,0,0,1);
            this.highwayCount += 1
            if (proposedEndpoint != undefined) {
              newEdge = new Edge(vec2.clone(newEdge.start), proposedEndpoint);
              this.highwayEdges[x * k + y].push(newEdge);
              this.streetEdges[x * k + y].push(newEdge);
              if (!noIntersectionNeeded) {
                let intersectionX: number = Math.floor((proposedEndpoint[0] + 1.0) * k / 2.0);
                let intersectionY: number = Math.floor((proposedEndpoint[1] + 1.0) * k / 2.0);
                if (intersectionX >= 0 && intersectionX < k && intersectionY >= 0 && intersectionY < k) {
                  this.highwayIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                  this.streetIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                }
              }
            } else {
              this.highwayEdges[x * k + y].push(newEdge);
              this.streetEdges[x * k + y].push(newEdge);
              newTurtle2.move();
              turtles.push(newTurtle2);
            }
          }
        }
      } else {
        if (this.terrain.heightField(vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1])) <= 0) {
          newTurtle2.move();
          if (this.terrain.heightField(vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1])) > 0) {
            let target: vec2 = vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1]);
            newTurtle2.moveBack();
            newTurtle2.moveBack();

            let newEdge: Edge = new Edge(vec2.fromValues(newTurtle2.position[0], newTurtle2.position[1]), target);

            let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
            let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
            let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);

            if (x >= 0 && x < k && y >= 0 && y < k) {
              let quaternion: quat = quat.fromValues(0,0,0,1);
              quat.rotationTo(quaternion, this.upVector, newTurtle2.orientation);
              quat.normalize(quaternion, quaternion);
              this.highwayTranslate.push(newTurtle2.position[0] + newTurtle2.scale[1] * newTurtle2.orientation[0], newTurtle2.position[1] + newTurtle2.scale[1] * newTurtle2.orientation[1], 0);
              this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
              this.highwayScale.push(newTurtle2.scale[0], 2 * newTurtle2.scale[1], newTurtle2.scale[2], 1);
              this.highwayColor.push(0,0,0,1);
              this.highwayCount += 1
              this.highwayEdges[x * k + y].push(newEdge);
              this.streetEdges[x * k + y].push(newEdge);
              newTurtle2.move();
              newTurtle2.move();
              turtles.push(newTurtle2);
            }
          }
        }
      }

      let newTurtle3: Turtle = currentTurtle.copy();
      newTurtle3.depth += 1;
      newTurtle3.streetScale = 0.5 / this.streetDensity;
      newTurtle3.rotate(vec3.fromValues(0,0,1), 90);
      newTurtle3.move();
      if (this.terrain.heightField(vec2.fromValues(newTurtle3.position[0], newTurtle3.position[1])) > 0) {
        let target: vec2 = vec2.fromValues(newTurtle3.position[0], newTurtle3.position[1]);
        newTurtle3.moveBack();

        let newEdge: Edge = new Edge(vec2.fromValues(newTurtle3.position[0], newTurtle3.position[1]), target);

        let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
        let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
        let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);

        if (x >= 0 && x < k && y >= 0 && y < k) {
          let nearestEdge: Edge = undefined;
          let nearestDist: number = this.highwayDimensions[1] * 8;
          let proposedEndpoint: vec2 = undefined;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.streetEdges[index].length; m++) {
                let otherEdge: Edge = this.streetEdges[index][m];
                if (newEdge.intersectsWith(otherEdge) != undefined) {
                  let intersection: vec2 = newEdge.intersectsWith(otherEdge);
                  let dist: number = vec2.distance(newEdge.start, intersection);
                  if (dist < nearestDist && dist >= 0.0001) {
                    nearestEdge = otherEdge;
                    nearestDist = dist;
                    proposedEndpoint = intersection;
                  }
                } else {
                  let extended: vec2 = vec2.create();
                  vec2.subtract(extended, newEdge.target, newEdge.start);
                  vec2.scale(extended, extended, 1.5);
                  vec2.add(extended, extended, newEdge.start);
                  let extendedEdge: Edge = new Edge(vec2.clone(newEdge.start), extended);
                  if (extendedEdge.intersectsWith(otherEdge) != undefined) {
                    let intersection: vec2 = extendedEdge.intersectsWith(otherEdge);
                    let dist: number = vec2.distance(extendedEdge.start, intersection);
                    if (dist < nearestDist && dist >= 0.0001) {
                      nearestEdge = otherEdge;
                      nearestDist = dist;
                      proposedEndpoint = intersection;
                    }
                  }
                }
              }
            }
          }
          let noIntersectionNeeded: boolean = false;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.streetIntersections[index].length; m++) {
                let otherIntersection: vec2 = this.streetIntersections[index][m];
                if (proposedEndpoint != undefined) {
                  let dist: number = vec2.distance(otherIntersection, proposedEndpoint);
                  if (dist < this.highwayDimensions[1] * 0.5 * newTurtle3.streetScale && dist < nearestDist && dist >= 0.0001) {
                    nearestDist = dist;
                    proposedEndpoint = otherIntersection;
                    noIntersectionNeeded = true;
                  }
                }
              }
            }
          }

          let overlappingEdge: boolean = false;
          if (proposedEndpoint != undefined) {
            let direction: vec2 = vec2.create();
            vec2.subtract(direction, proposedEndpoint, vec2.fromValues(newTurtle3.position[0], newTurtle3.position[1]));
            if (vec2.length(direction) < 0.0001) {
              overlappingEdge = true;
            } else {
              let normalized: vec2 = vec2.create();
              vec2.normalize(normalized, direction);
              newTurtle3.orientation = vec3.fromValues(normalized[0], normalized[1], 0);
              newTurtle3.scale[1] = vec2.length(direction) / newTurtle3.streetScale;
            }
          }

          if (!overlappingEdge) {
            let quaternion: quat = quat.fromValues(0,0,0,1);
            quat.rotationTo(quaternion, this.upVector, newTurtle3.orientation);
            quat.normalize(quaternion, quaternion);
            this.streetTranslate.push(newTurtle3.position[0] + 0.5 * newTurtle3.scale[1] * newTurtle3.streetScale * newTurtle3.orientation[0], newTurtle3.position[1] + 0.5 * newTurtle3.scale[1] * newTurtle3.streetScale * newTurtle3.orientation[1], 0);
            this.streetRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            this.streetScale.push(newTurtle3.scale[0] * newTurtle3.streetScale, newTurtle3.scale[1] * newTurtle3.streetScale, newTurtle3.scale[2] * newTurtle3.streetScale, 1);
            this.streetColor.push(0,0,0,1);
            this.streetCount += 1
            if (proposedEndpoint != undefined) {
              newEdge = new Edge(vec2.clone(newEdge.start), proposedEndpoint);
              this.streetEdges[x * k + y].push(newEdge);
              if (!noIntersectionNeeded) {
                let intersectionX: number = Math.floor((proposedEndpoint[0] + 1.0) * k / 2.0);
                let intersectionY: number = Math.floor((proposedEndpoint[1] + 1.0) * k / 2.0);
                if (intersectionX >= 0 && intersectionX < k && intersectionY >= 0 && intersectionY < k) {
                  this.streetIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                }
              }
            } else {
              this.streetEdges[x * k + y].push(newEdge);
              newTurtle3.move();
              roadTurtles.push(newTurtle3);
            }
          }
        }
      }

      let newTurtle4: Turtle = currentTurtle.copy();
      newTurtle4.depth += 1;
      newTurtle4.streetScale = 0.5 / this.streetDensity;
      newTurtle4.rotate(vec3.fromValues(0,0,1), -90);
      newTurtle4.move();
      if (this.terrain.heightField(vec2.fromValues(newTurtle4.position[0], newTurtle4.position[1])) > 0) {
        let target: vec2 = vec2.fromValues(newTurtle4.position[0], newTurtle4.position[1]);
        newTurtle4.moveBack();

        let newEdge: Edge = new Edge(vec2.fromValues(newTurtle4.position[0], newTurtle4.position[1]), target);

        let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
        let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
        let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);

        if (x >= 0 && x < k && y >= 0 && y < k) {
          let nearestEdge: Edge = undefined;
          let nearestDist: number = this.highwayDimensions[1] * 8;
          let proposedEndpoint: vec2 = undefined;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.streetEdges[index].length; m++) {
                let otherEdge: Edge = this.streetEdges[index][m];
                if (newEdge.intersectsWith(otherEdge) != undefined) {
                  let intersection: vec2 = newEdge.intersectsWith(otherEdge);
                  let dist: number = vec2.distance(newEdge.start, intersection);
                  if (dist < nearestDist && dist >= 0.0001) {
                    nearestEdge = otherEdge;
                    nearestDist = dist;
                    proposedEndpoint = intersection;
                  }
                } else {
                  let extended: vec2 = vec2.create();
                  vec2.subtract(extended, newEdge.target, newEdge.start);
                  vec2.scale(extended, extended, 1.5);
                  vec2.add(extended, extended, newEdge.start);
                  let extendedEdge: Edge = new Edge(vec2.clone(newEdge.start), extended);
                  if (extendedEdge.intersectsWith(otherEdge) != undefined) {
                    let intersection: vec2 = extendedEdge.intersectsWith(otherEdge);
                    let dist: number = vec2.distance(extendedEdge.start, intersection);
                    if (dist < nearestDist && dist >= 0.0001) {
                      nearestEdge = otherEdge;
                      nearestDist = dist;
                      proposedEndpoint = intersection;
                    }
                  }
                }
              }
            }
          }
          let noIntersectionNeeded: boolean = false;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.streetIntersections[index].length; m++) {
                let otherIntersection: vec2 = this.streetIntersections[index][m];
                if (proposedEndpoint != undefined) {
                  let dist: number = vec2.distance(otherIntersection, proposedEndpoint);
                  if (dist < this.highwayDimensions[1] * 0.5 * newTurtle4.streetScale && dist < nearestDist && dist >= 0.0001) {
                    nearestDist = dist;
                    proposedEndpoint = otherIntersection;
                    noIntersectionNeeded = true;
                  }
                }
              }
            }
          }

          let overlappingEdge: boolean = false;
          if (proposedEndpoint != undefined) {
            let direction: vec2 = vec2.create();
            vec2.subtract(direction, proposedEndpoint, vec2.fromValues(newTurtle4.position[0], newTurtle4.position[1]));
            if (vec2.length(direction) < 0.0001) {
              overlappingEdge = true;
            } else {
              let normalized: vec2 = vec2.create();
              vec2.normalize(normalized, direction);
              newTurtle4.orientation = vec3.fromValues(normalized[0], normalized[1], 0);
              newTurtle4.scale[1] = vec2.length(direction) / newTurtle3.streetScale;
            }
          }

          if (!overlappingEdge) {
            let quaternion: quat = quat.fromValues(0,0,0,1);
            quat.rotationTo(quaternion, this.upVector, newTurtle4.orientation);
            quat.normalize(quaternion, quaternion);
            this.streetTranslate.push(newTurtle4.position[0] + 0.5 * newTurtle4.scale[1] * newTurtle4.streetScale * newTurtle4.orientation[0], newTurtle4.position[1] + 0.5 * newTurtle4.scale[1] * newTurtle4.streetScale * newTurtle4.orientation[1], 0);
            this.streetRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            this.streetScale.push(newTurtle4.scale[0] * newTurtle4.streetScale, newTurtle4.scale[1] * newTurtle4.streetScale, newTurtle4.scale[2] * newTurtle4.streetScale, 1);
            this.streetColor.push(0,0,0,1);
            this.streetCount += 1
            if (proposedEndpoint != undefined) {
              newEdge = new Edge(vec2.clone(newEdge.start), proposedEndpoint);
              this.streetEdges[x * k + y].push(newEdge);
              if (!noIntersectionNeeded) {
                let intersectionX: number = Math.floor((proposedEndpoint[0] + 1.0) * k / 2.0);
                let intersectionY: number = Math.floor((proposedEndpoint[1] + 1.0) * k / 2.0);
                if (intersectionX >= 0 && intersectionX < k && intersectionY >= 0 && intersectionY < k) {
                  this.streetIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                }
              }
            } else {
              this.streetEdges[x * k + y].push(newEdge);
              newTurtle4.move();
              roadTurtles.push(newTurtle4);
            }
          }
        }
      }

      currentTurtle.move();
      if (this.terrain.populationDensity(vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1])) > this.highwayThreshold) {
        let target: vec2 = vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1]);
        currentTurtle.moveBack();

        let newEdge: Edge = new Edge(vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1]), target);

        let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
        let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
        let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);
        if (x < 0 || x >= k || y < 0 || y >= k) {
          currentTurtle = turtles.pop();
          continue;
        }

        let nearestEdge: Edge = undefined;
        let nearestDist: number = this.highwayDimensions[1] * 8;
        let proposedEndpoint: vec2 = undefined;
        for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
          for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
            let index: number = i * k + j;
            for (let m: number = 0; m < this.highwayEdges[index].length; m++) {
              let otherEdge: Edge = this.highwayEdges[index][m];
              if (newEdge.intersectsWith(otherEdge) != undefined) {
                let intersection: vec2 = newEdge.intersectsWith(otherEdge);
                let dist: number = vec2.distance(newEdge.start, intersection);
                if (dist < nearestDist && dist >= 0.0001) {
                  nearestEdge = otherEdge;
                  nearestDist = dist;
                  proposedEndpoint = intersection;
                }
              } else {
                let extended: vec2 = vec2.create();
                vec2.subtract(extended, newEdge.target, newEdge.start);
                vec2.scale(extended, extended, 1.5);
                vec2.add(extended, extended, newEdge.start);
                let extendedEdge: Edge = new Edge(vec2.clone(newEdge.start), extended);
                if (extendedEdge.intersectsWith(otherEdge) != undefined) {
                  let intersection: vec2 = extendedEdge.intersectsWith(otherEdge);
                  let dist: number = vec2.distance(extendedEdge.start, intersection);
                  if (dist < nearestDist && dist >= 0.0001) {
                    nearestEdge = otherEdge;
                    nearestDist = dist;
                    proposedEndpoint = intersection;
                  }
                }
              }
            }
          }
        }
        let noIntersectionNeeded: boolean = false;
        for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
          for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
            let index: number = i * k + j;
            for (let m: number = 0; m < this.highwayIntersections[index].length; m++) {
              let otherIntersection: vec2 = this.highwayIntersections[index][m];
              if (proposedEndpoint != undefined) {
                let dist: number = vec2.distance(otherIntersection, proposedEndpoint);
                if (dist < this.highwayDimensions[1] * 0.5 && dist < nearestDist && dist >= 0.0001) {
                  nearestDist = dist;
                  proposedEndpoint = otherIntersection;
                  noIntersectionNeeded = true;
                }
              }
            }
          }
        }

        let overlappingEdge: boolean = false;
        if (proposedEndpoint != undefined) {
          let direction: vec2 = vec2.create();
          vec2.subtract(direction, proposedEndpoint, vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1]));
          if (vec2.length(direction) < 0.0001) {
            overlappingEdge = true;
          } else {
            let normalized: vec2 = vec2.create();
            vec2.normalize(normalized, direction);
            currentTurtle.orientation = vec3.fromValues(normalized[0], normalized[1], 0);
            currentTurtle.scale[1] = vec2.length(direction);
          }
        }

        if (!overlappingEdge) {

          let quaternion: quat = quat.fromValues(0,0,0,1);
          quat.rotationTo(quaternion, this.upVector, currentTurtle.orientation);
          quat.normalize(quaternion, quaternion);
          this.highwayTranslate.push(currentTurtle.position[0] + 0.5 * currentTurtle.scale[1] * currentTurtle.orientation[0], currentTurtle.position[1] + 0.5 * currentTurtle.scale[1] * currentTurtle.orientation[1], 0);
          this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
          this.highwayScale.push(currentTurtle.scale[0], currentTurtle.scale[1], currentTurtle.scale[2], 1);
          this.highwayColor.push(0,0,0,1);
          this.highwayCount += 1
          if (proposedEndpoint != undefined) {
            newEdge = new Edge(vec2.clone(newEdge.start), proposedEndpoint);
            this.highwayEdges[x * k + y].push(newEdge);
            this.streetEdges[x * k + y].push(newEdge);
            if (!noIntersectionNeeded) {
              let intersectionX: number = Math.floor((proposedEndpoint[0] + 1.0) * k / 2.0);
              let intersectionY: number = Math.floor((proposedEndpoint[1] + 1.0) * k / 2.0);
              if (intersectionX >= 0 && intersectionX < k && intersectionY >= 0 && intersectionY < k) {
                this.highwayIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                this.streetIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
              }
            }
            currentTurtle = turtles.pop();
          } else {
            this.highwayEdges[x * k + y].push(newEdge);
            this.streetEdges[x * k + y].push(newEdge);
            currentTurtle.move();
          }
        }
      } else {
        if (this.terrain.heightField(vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1])) <= 0) {
          currentTurtle.move();
          if (this.terrain.heightField(vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1])) > 0) {
            let target: vec2 = vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1]);
            currentTurtle.moveBack();
            currentTurtle.moveBack();

            let newEdge: Edge = new Edge(vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1]), target);

            let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
            let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
            let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);
            if (x < 0 || x >= k || y < 0 || y >= k) {
              currentTurtle = turtles.pop();
              continue;
            }

            let quaternion: quat = quat.fromValues(0,0,0,1);
            quat.rotationTo(quaternion, this.upVector, currentTurtle.orientation);
            quat.normalize(quaternion, quaternion);
            this.highwayTranslate.push(currentTurtle.position[0] + currentTurtle.scale[1] * currentTurtle.orientation[0], currentTurtle.position[1] + currentTurtle.scale[1] * currentTurtle.orientation[1], 0);
            this.highwayRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            this.highwayScale.push(currentTurtle.scale[0], 2 * currentTurtle.scale[1], currentTurtle.scale[2], 1);
            this.highwayColor.push(0,0,0,1);
            this.highwayCount += 1
            this.highwayEdges[x * k + y].push(newEdge);
            this.streetEdges[x * k + y].push(newEdge);
            currentTurtle.move();
            currentTurtle.move();
          } else {
            currentTurtle.moveBack();
            currentTurtle.moveBack();
            currentTurtle = turtles.pop();
          }
        } else {
          currentTurtle.moveBack();
          currentTurtle = turtles.pop();
        }
      }
    }

    currentTurtle = roadTurtles[0];
    while (currentTurtle != null) {
      let newTurtle3: Turtle = currentTurtle.copy();
      newTurtle3.depth += 1;
      newTurtle3.streetScale = 0.5 / this.streetDensity;
      newTurtle3.rotate(vec3.fromValues(0,0,1), 90);
      newTurtle3.move();
      if (this.terrain.heightField(vec2.fromValues(newTurtle3.position[0], newTurtle3.position[1])) > 0) {
        let target: vec2 = vec2.fromValues(newTurtle3.position[0], newTurtle3.position[1]);
        newTurtle3.moveBack();

        let newEdge: Edge = new Edge(vec2.fromValues(newTurtle3.position[0], newTurtle3.position[1]), target);

        let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
        let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
        let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);

        if (x >= 0 && x < k && y >= 0 && y < k) {
          let nearestEdge: Edge = undefined;
          let nearestDist: number = this.highwayDimensions[1] * 8;
          let proposedEndpoint: vec2 = undefined;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.streetEdges[index].length; m++) {
                let otherEdge: Edge = this.streetEdges[index][m];
                if (newEdge.intersectsWith(otherEdge) != undefined) {
                  let intersection: vec2 = newEdge.intersectsWith(otherEdge);
                  let dist: number = vec2.distance(newEdge.start, intersection);
                  if (dist < nearestDist && dist >= 0.0001) {
                    nearestEdge = otherEdge;
                    nearestDist = dist;
                    proposedEndpoint = intersection;
                  }
                } else {
                  let extended: vec2 = vec2.create();
                  vec2.subtract(extended, newEdge.target, newEdge.start);
                  vec2.scale(extended, extended, 1);
                  vec2.add(extended, extended, newEdge.start);
                  let extendedEdge: Edge = new Edge(vec2.clone(newEdge.start), extended);
                  if (extendedEdge.intersectsWith(otherEdge) != undefined) {
                    let intersection: vec2 = extendedEdge.intersectsWith(otherEdge);
                    let dist: number = vec2.distance(extendedEdge.start, intersection);
                    if (dist < nearestDist && dist >= 0.0001) {
                      nearestEdge = otherEdge;
                      nearestDist = dist;
                      proposedEndpoint = intersection;
                    }
                  }
                }
              }
            }
          }
          let noIntersectionNeeded: boolean = false;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.streetIntersections[index].length; m++) {
                let otherIntersection: vec2 = this.streetIntersections[index][m];
                if (proposedEndpoint != undefined) {
                  let dist: number = vec2.distance(otherIntersection, proposedEndpoint);
                  if (dist < this.highwayDimensions[1] * 0.2 * newTurtle3.streetScale && dist < nearestDist && dist >= 0.0001) {
                    nearestDist = dist;
                    proposedEndpoint = otherIntersection;
                    noIntersectionNeeded = true;
                  }
                }
              }
            }
          }

          let overlappingEdge: boolean = false;
          if (proposedEndpoint != undefined) {
            let direction: vec2 = vec2.create();
            vec2.subtract(direction, proposedEndpoint, vec2.fromValues(newTurtle3.position[0], newTurtle3.position[1]));
            if (vec2.length(direction) < 0.0001) {
              overlappingEdge = true;
            } else {
              let normalized: vec2 = vec2.create();
              vec2.normalize(normalized, direction);
              newTurtle3.orientation = vec3.fromValues(normalized[0], normalized[1], 0);
              newTurtle3.scale[1] = vec2.length(direction) / newTurtle3.streetScale;
            }
          }

          if (!overlappingEdge) {
            let quaternion: quat = quat.fromValues(0,0,0,1);
            quat.rotationTo(quaternion, this.upVector, newTurtle3.orientation);
            quat.normalize(quaternion, quaternion);
            this.streetTranslate.push(newTurtle3.position[0] + 0.5 * newTurtle3.scale[1] * newTurtle3.streetScale * newTurtle3.orientation[0], newTurtle3.position[1] + 0.5 * newTurtle3.scale[1] * newTurtle3.streetScale * newTurtle3.orientation[1], 0);
            this.streetRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            this.streetScale.push(newTurtle3.scale[0] * newTurtle3.streetScale, newTurtle3.scale[1] * newTurtle3.streetScale, newTurtle3.scale[2] * newTurtle3.streetScale, 1);
            this.streetColor.push(0,0,0,1);
            this.streetCount += 1
            if (proposedEndpoint != undefined) {
              newEdge = new Edge(vec2.clone(newEdge.start), proposedEndpoint);
              this.streetEdges[x * k + y].push(newEdge);
              if (!noIntersectionNeeded) {
                let intersectionX: number = Math.floor((proposedEndpoint[0] + 1.0) * k / 2.0);
                let intersectionY: number = Math.floor((proposedEndpoint[1] + 1.0) * k / 2.0);
                if (intersectionX >= 0 && intersectionX < k && intersectionY >= 0 && intersectionY < k) {
                  this.streetIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                }
              }
            } else {
              this.streetEdges[x * k + y].push(newEdge);
              newTurtle3.move();
              roadTurtles.push(newTurtle3);
            }
          }
        }
      }

      let newTurtle4: Turtle = currentTurtle.copy();
      newTurtle4.depth += 1;
      newTurtle4.streetScale = 0.5 / this.streetDensity;
      newTurtle4.rotate(vec3.fromValues(0,0,1), -90);
      newTurtle4.move();
      if (this.terrain.heightField(vec2.fromValues(newTurtle4.position[0], newTurtle4.position[1])) > 0) {
        let target: vec2 = vec2.fromValues(newTurtle4.position[0], newTurtle4.position[1]);
        newTurtle4.moveBack();

        let newEdge: Edge = new Edge(vec2.fromValues(newTurtle4.position[0], newTurtle4.position[1]), target);

        let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
        let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
        let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);

        if (x >= 0 && x < k && y >= 0 && y < k) {
          let nearestEdge: Edge = undefined;
          let nearestDist: number = this.highwayDimensions[1] * 8;
          let proposedEndpoint: vec2 = undefined;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.streetEdges[index].length; m++) {
                let otherEdge: Edge = this.streetEdges[index][m];
                if (newEdge.intersectsWith(otherEdge) != undefined) {
                  let intersection: vec2 = newEdge.intersectsWith(otherEdge);
                  let dist: number = vec2.distance(newEdge.start, intersection);
                  if (dist < nearestDist && dist >= 0.0001) {
                    nearestEdge = otherEdge;
                    nearestDist = dist;
                    proposedEndpoint = intersection;
                  }
                } else {
                  let extended: vec2 = vec2.create();
                  vec2.subtract(extended, newEdge.target, newEdge.start);
                  vec2.scale(extended, extended, 1);
                  vec2.add(extended, extended, newEdge.start);
                  let extendedEdge: Edge = new Edge(vec2.clone(newEdge.start), extended);
                  if (extendedEdge.intersectsWith(otherEdge) != undefined) {
                    let intersection: vec2 = extendedEdge.intersectsWith(otherEdge);
                    let dist: number = vec2.distance(extendedEdge.start, intersection);
                    if (dist < nearestDist && dist >= 0.0001) {
                      nearestEdge = otherEdge;
                      nearestDist = dist;
                      proposedEndpoint = intersection;
                    }
                  }
                }
              }
            }
          }
          let noIntersectionNeeded: boolean = false;
          for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
            for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
              let index: number = i * k + j;
              for (let m: number = 0; m < this.streetIntersections[index].length; m++) {
                let otherIntersection: vec2 = this.streetIntersections[index][m];
                if (proposedEndpoint != undefined) {
                  let dist: number = vec2.distance(otherIntersection, proposedEndpoint);
                  if (dist < this.highwayDimensions[1] * 0.2 * newTurtle4.streetScale && dist < nearestDist && dist >= 0.0001) {
                    nearestDist = dist;
                    proposedEndpoint = otherIntersection;
                    noIntersectionNeeded = true;
                  }
                }
              }
            }
          }

          let overlappingEdge: boolean = false;
          if (proposedEndpoint != undefined) {
            let direction: vec2 = vec2.create();
            vec2.subtract(direction, proposedEndpoint, vec2.fromValues(newTurtle4.position[0], newTurtle4.position[1]));
            if (vec2.length(direction) < 0.0001) {
              overlappingEdge = true;
            } else {
              let normalized: vec2 = vec2.create();
              vec2.normalize(normalized, direction);
              newTurtle4.orientation = vec3.fromValues(normalized[0], normalized[1], 0);
              newTurtle4.scale[1] = vec2.length(direction) / newTurtle3.streetScale;
            }
          }

          if (!overlappingEdge) {
            let quaternion: quat = quat.fromValues(0,0,0,1);
            quat.rotationTo(quaternion, this.upVector, newTurtle4.orientation);
            quat.normalize(quaternion, quaternion);
            this.streetTranslate.push(newTurtle4.position[0] + 0.5 * newTurtle4.scale[1] * newTurtle4.streetScale * newTurtle4.orientation[0], newTurtle4.position[1] + 0.5 * newTurtle4.scale[1] * newTurtle4.streetScale * newTurtle4.orientation[1], 0);
            this.streetRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            this.streetScale.push(newTurtle4.scale[0] * newTurtle4.streetScale, newTurtle4.scale[1] * newTurtle4.streetScale, newTurtle4.scale[2] * newTurtle4.streetScale, 1);
            this.streetColor.push(0,0,0,1);
            this.streetCount += 1
            if (proposedEndpoint != undefined) {
              newEdge = new Edge(vec2.clone(newEdge.start), proposedEndpoint);
              this.streetEdges[x * k + y].push(newEdge);
              if (!noIntersectionNeeded) {
                let intersectionX: number = Math.floor((proposedEndpoint[0] + 1.0) * k / 2.0);
                let intersectionY: number = Math.floor((proposedEndpoint[1] + 1.0) * k / 2.0);
                if (intersectionX >= 0 && intersectionX < k && intersectionY >= 0 && intersectionY < k) {
                  this.streetIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
                }
              }
            } else {
              this.streetEdges[x * k + y].push(newEdge);
              newTurtle4.move();
              roadTurtles.push(newTurtle4);
            }
          }
        }
      }

      currentTurtle.move();
      if (this.terrain.heightField(vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1])) > 0) {
        let target: vec2 = vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1]);
        currentTurtle.moveBack();

        let newEdge: Edge = new Edge(vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1]), target);

        let k: number = Math.ceil(0.4 / this.highwayDimensions[1]);
        let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
        let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);
        if (x < 0 || x >= k || y < 0 || y >= k) {
          roadTurtles.shift();
          currentTurtle = roadTurtles[0];
          continue;
        }

        let nearestEdge: Edge = undefined;
        let nearestDist: number = this.highwayDimensions[1] * 8;
        let proposedEndpoint: vec2 = undefined;
        for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
          for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
            let index: number = i * k + j;
            for (let m: number = 0; m < this.streetEdges[index].length; m++) {
              let otherEdge: Edge = this.streetEdges[index][m];
              if (newEdge.intersectsWith(otherEdge) != undefined) {
                let intersection: vec2 = newEdge.intersectsWith(otherEdge);
                let dist: number = vec2.distance(newEdge.start, intersection);
                if (dist < nearestDist && dist >= 0.0001) {
                  nearestEdge = otherEdge;
                  nearestDist = dist;
                  proposedEndpoint = intersection;
                }
              } else {
                let extended: vec2 = vec2.create();
                vec2.subtract(extended, newEdge.target, newEdge.start);
                vec2.scale(extended, extended, 1);
                vec2.add(extended, extended, newEdge.start);
                let extendedEdge: Edge = new Edge(vec2.clone(newEdge.start), extended);
                if (extendedEdge.intersectsWith(otherEdge) != undefined) {
                  let intersection: vec2 = extendedEdge.intersectsWith(otherEdge);
                  let dist: number = vec2.distance(extendedEdge.start, intersection);
                  if (dist < nearestDist && dist >= 0.0001) {
                    nearestEdge = otherEdge;
                    nearestDist = dist;
                    proposedEndpoint = intersection;
                  }
                }
              }
            }
          }
        }
        let noIntersectionNeeded: boolean = false;
        for (let i : number = Math.max(0, x - 2); i <= Math.min(k - 1, x + 2); i++) {
          for (let j : number = Math.max(0, y - 2); j <= Math.min(k - 1, y + 2); j++) {
            let index: number = i * k + j;
            for (let m: number = 0; m < this.streetIntersections[index].length; m++) {
              let otherIntersection: vec2 = this.streetIntersections[index][m];
              if (proposedEndpoint != undefined) {
                let dist: number = vec2.distance(otherIntersection, proposedEndpoint);
                if (dist < this.highwayDimensions[1] * 0.2 * currentTurtle.streetScale && dist < nearestDist && dist >= 0.0001) {
                  nearestDist = dist;
                  proposedEndpoint = otherIntersection;
                  noIntersectionNeeded = true;
                }
              }
            }
          }
        }

        let overlappingEdge: boolean = false;
        if (proposedEndpoint != undefined) {
          let direction: vec2 = vec2.create();
          vec2.subtract(direction, proposedEndpoint, vec2.fromValues(currentTurtle.position[0], currentTurtle.position[1]));
          if (vec2.length(direction) < 0.0001) {
            overlappingEdge = true;
          } else {
            let normalized: vec2 = vec2.create();
            vec2.normalize(normalized, direction);
            currentTurtle.orientation = vec3.fromValues(normalized[0], normalized[1], 0);
            currentTurtle.scale[1] = vec2.length(direction) / newTurtle3.streetScale;
          }
        }

        if (!overlappingEdge) {
          let quaternion: quat = quat.fromValues(0,0,0,1);
          quat.rotationTo(quaternion, this.upVector, currentTurtle.orientation);
          quat.normalize(quaternion, quaternion);
          this.streetTranslate.push(currentTurtle.position[0] + 0.5 * currentTurtle.scale[1] * currentTurtle.streetScale * currentTurtle.orientation[0], currentTurtle.position[1] + 0.5 * currentTurtle.scale[1] * currentTurtle.streetScale * currentTurtle.orientation[1], 0);
          this.streetRotate.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
          this.streetScale.push(currentTurtle.scale[0] * currentTurtle.streetScale, currentTurtle.scale[1] * currentTurtle.streetScale, currentTurtle.scale[2] * currentTurtle.streetScale, 1);
          this.streetColor.push(0,0,0,1);
          this.streetCount += 1
          if (proposedEndpoint != undefined) {
            newEdge = new Edge(vec2.clone(newEdge.start), proposedEndpoint);
            this.streetEdges[x * k + y].push(newEdge);
            if (!noIntersectionNeeded) {
              let intersectionX: number = Math.floor((proposedEndpoint[0] + 1.0) * k / 2.0);
              let intersectionY: number = Math.floor((proposedEndpoint[1] + 1.0) * k / 2.0);
              if (intersectionX >= 0 && intersectionX < k && intersectionY >= 0 && intersectionY < k) {
                this.streetIntersections[intersectionX * k + intersectionY].push(proposedEndpoint);
              }
            }
            roadTurtles.shift();
            currentTurtle = roadTurtles[0];
          } else {
            this.streetEdges[x * k + y].push(newEdge);
            currentTurtle.move();
          }
        } else {
          roadTurtles.shift();
          currentTurtle = roadTurtles[0];
        }
      } else {
        currentTurtle.moveBack();
        roadTurtles.shift();
        currentTurtle = roadTurtles[0];
      }
    }
  }
};

class Edge {
  start: vec2;
  target: vec2;
  midpoint: vec2;

  constructor(start: vec2, target: vec2) {
    this.start = start;
    this.target = target;
    this.midpoint = vec2.create();
    vec2.add(this.midpoint, this.start, this.target);
    vec2.scale(this.midpoint, this.midpoint, 0.5);
  }

  between(a: number, b: number, c: number) {
    var eps = 0.0000001;
    return a - eps <= b && b <= c + eps;
  }

  intersectsWith(other: Edge) { // Adapted from https://gist.github.com/gordonwoodhull/50eb65d2f048789f9558
    var x1 = this.start[0];
    var y1 = this.start[1];
    var x2 = this.target[0];
    var y2 = this.target[1];
    var x3 = other.start[0];
    var y3 = other.start[1];
    var x4 = other.target[0];
    var y4 = other.target[1];
    var x = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) / ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) / ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x) || isNaN(y)) {
      return undefined;
    } else {
      if (x1 >= x2) {
        if (!this.between(x2, x, x1)) {return undefined;}
      } else {
        if (!this.between(x1, x, x2)) {return undefined;}
      }
      if (y1 >= y2) {
        if (!this.between(y2, y, y1)) {return undefined;}
      } else {
        if (!this.between(y1, y, y2)) {return undefined;}
      }
      if (x3 >= x4) {
        if (!this.between(x4, x, x3)) {return undefined;}
      } else {
        if (!this.between(x3, x, x4)) {return undefined;}
      }
      if (y3 >= y4) {
        if (!this.between(y4, y, y3)) {return undefined;}
      } else {
        if (!this.between(y3, y, y4)) {return undefined;}
      }
    }
    return vec2.fromValues(x, y);
  }
}

export default RoadNetwork;
