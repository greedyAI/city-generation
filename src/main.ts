import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import RoadNetwork from './RoadNetwork';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Regenerate': createRoadNetwork,
  checkered: false,
  showHeight: false,
  showPopulation: false,
  showBoth: true,
  highwayDensity: 1,
  streetDensity: 3,
  populationThreshold: 0.9,
  randomSeed: 0.0
};

let screenQuad: ScreenQuad;
let highway: Square;
let street: Square;

let roadNetwork: RoadNetwork;
let terrainPixels: Uint8Array;
let width: number = 1920;
let height: number = 1080;
let time: number = 0.0;

function createScreenQuad() {
  screenQuad = new ScreenQuad();
  screenQuad.create();
  highway = new Square();
  highway.create();
  street = new Square();
  street.create();
}

function createRoadNetwork() {
  roadNetwork = new RoadNetwork(controls.checkered, controls.highwayDensity, controls.streetDensity, controls.populationThreshold, controls.randomSeed, terrainPixels, width, height);
  roadNetwork.createNetwork();

  highway.setInstanceVBOs(new Float32Array(roadNetwork.highwayTranslate), new Float32Array(roadNetwork.highwayRotate), new Float32Array(roadNetwork.highwayScale), new Float32Array(roadNetwork.highwayColor));
  highway.setNumInstances(roadNetwork.highwayCount);

  street.setInstanceVBOs(new Float32Array(roadNetwork.streetTranslate), new Float32Array(roadNetwork.streetRotate), new Float32Array(roadNetwork.streetScale), new Float32Array(roadNetwork.streetColor));
  street.setNumInstances(roadNetwork.streetCount);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  gui.add(controls, 'Regenerate');
  gui.add(controls, 'highwayDensity', 0.2, 2).name("Highway Density");
  gui.add(controls, 'streetDensity', 1, 3).name("Street Density");
  gui.add(controls, 'populationThreshold', 0, 2).name("Population Threshold");
  gui.add(controls, 'randomSeed', -1000, 1000).name("Random Seed");
  gui.add(controls, 'checkered').name("Checkered Road Networking");

  var showHeightController = gui.add(controls, 'showHeight').name("Show Height").listen();
  showHeightController.onChange(function(value: boolean){
    controls.showHeight = true;
    controls.showPopulation = false;
    controls.showBoth = false;
  });

  var showPopulationController = gui.add(controls, 'showPopulation').name("Show Population").listen();
  showPopulationController.onChange(function(value: boolean){
    controls.showHeight = false;
    controls.showPopulation = true;
    controls.showBoth = false;
  });

  var showBothController = gui.add(controls, 'showBoth').name("Show Both").listen();
  showBothController.onChange(function(value: boolean){
    controls.showHeight = false;
    controls.showPopulation = false;
    controls.showBoth = true;
  });

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  createScreenQuad();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  // gl.enable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const textureShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/texture-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/texture-frag.glsl')),
  ]);

  var frameBuffer = gl.createFramebuffer();
  var renderBuffer = gl.createRenderbuffer();
  var terrainTexture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, terrainTexture, 0);

  gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  renderer.render(camera, flat, [screenQuad]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, terrainTexture, 0);

  terrainPixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, terrainPixels);
  createRoadNetwork();

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, terrainTexture);

    if (controls.showHeight) {
      textureShader.setMapState(0);
    } else if (controls.showPopulation) {
      textureShader.setMapState(1);
    } else if (controls.showBoth) {
      textureShader.setMapState(2);
    }

    renderer.render(camera, textureShader, [screenQuad]);
    renderer.render(camera, instancedShader, [
      highway,
      street
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(width, height);
    camera.setAspectRatio(width / height);
    camera.updateProjectionMatrix();
    flat.setDimensions(width, height);
  }, false);

  renderer.setSize(width, height);
  camera.setAspectRatio(width / height);
  camera.updateProjectionMatrix();
  flat.setDimensions(width, height);

  // Start the render loop
  tick();
}

main();
