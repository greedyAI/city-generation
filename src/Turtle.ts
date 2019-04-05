import {glMatrix, vec3, vec4, quat} from 'gl-matrix';

class Turtle {
  position: vec3;
  orientation: vec3; // index 0 = right, index 1 = up, index 2 = forward
  scale: vec3;  // index 0 = right, index 1 = up, index 2 = forward
  depth: number;
  streetScale: number;

  constructor(position: vec3, orientation: vec3, scale: vec3, depth: number) {
    this.position = position;
    this.orientation = orientation;
    this.scale = scale;
    this.depth = depth;
    this.streetScale = 1;
  }

  rotate(axisOfRotation: vec3, angle: number) {
    let quaternion: quat = quat.create();
    let newOrientation: vec4 = vec4.fromValues(this.orientation[0], this.orientation[1], this.orientation[2], 0);
    vec3.normalize(axisOfRotation, axisOfRotation);
    quat.setAxisAngle(quaternion, axisOfRotation, glMatrix.toRadian(angle));
    quat.normalize(quaternion, quaternion);
    vec4.transformQuat(newOrientation, newOrientation, quaternion);
    this.orientation = vec3.fromValues(newOrientation[0], newOrientation[1], newOrientation[2]);
    vec3.normalize(this.orientation, this.orientation);
  }

  move() {
    vec3.add(this.position, this.position, vec3.fromValues(this.scale[1] * this.orientation[0] * this.streetScale, this.scale[1] * this.orientation[1] * this.streetScale, this.scale[1] * this.orientation[2] * this.streetScale));
  }

  moveBack() {
    vec3.add(this.position, this.position, vec3.fromValues(this.scale[1] * -this.orientation[0] * this.streetScale, this.scale[1] * -this.orientation[1] * this.streetScale, this.scale[1] * -this.orientation[2] * this.streetScale));
  }

  copy() {
    let newPosition: vec3 = vec3.create();
    vec3.copy(newPosition, this.position);
    let newOrientation: vec3 = vec3.create();
    vec3.copy(newOrientation, this.orientation);
    let newScale: vec3 = vec3.create();
    vec3.copy(newScale, this.scale);
    let newTurtle: Turtle = new Turtle(newPosition, newOrientation, newScale, this.depth);
    return newTurtle;
  }
}

export default Turtle;
