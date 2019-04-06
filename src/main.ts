import {vec2, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import PentagonalPrism from './geometry/PentagonalPrism';
import HexagonalPrism from './geometry/HexagonalPrism';
import Plane from './geometry/Plane';
import Cube from './geometry/Cube';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import {RoadNetwork, Edge} from './RoadNetwork';
import Buildings from './Buildings';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Regenerate': createRoadNetwork,
  checkered: false,
  showHeight: false,
  showPopulation: false,
  showBoth: true,
  highwayDensity: 1,
  streetDensity: 2.5,
  populationThreshold: 0.9,
  randomSeed: 0.0
};

let sky: ScreenQuad;
let screenQuad: ScreenQuad;
let plane: Plane;
let highway: Cube;
let street: Cube;
let cubeBuildings: Cube;
let pentagonBuildings: PentagonalPrism;
let hexagonBuildings: HexagonalPrism;

let roadNetwork: RoadNetwork;
let rasterizedGrid: any;
let houseGrid: any;
let mediumGrid: any;
let buildings: Buildings;
let terrainPixels: Uint8Array;
let width: number = 1920;
let height: number = 1080;
let time: number = 0.0;

let gridDensity = 5;
let houseDensity = 5;
let mediumDensity = 8;
let buildingDensity = 0.75;

function createScreenQuad() {
  sky = new ScreenQuad();
  sky.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  plane = new Plane(vec3.fromValues(0,0,0), vec2.fromValues(2,2), 22);
  plane.create();
  highway = new Cube(vec3.fromValues(0,0,0));
  highway.create();
  street = new Cube(vec3.fromValues(0,0,0));
  street.create();
  cubeBuildings = new Cube(vec3.fromValues(0,0,0));
  cubeBuildings.create();
  pentagonBuildings = new PentagonalPrism();
  pentagonBuildings.create();
  hexagonBuildings = new HexagonalPrism();
  hexagonBuildings.create();
}

function createRoadNetwork() {
  roadNetwork = new RoadNetwork(controls.checkered, controls.highwayDensity, controls.streetDensity, controls.populationThreshold, controls.randomSeed, terrainPixels, width, height);
  roadNetwork.createNetwork();

  highway.setInstanceVBOs(new Float32Array(roadNetwork.highwayTranslate), new Float32Array(roadNetwork.highwayRotate), new Float32Array(roadNetwork.highwayScale), new Float32Array(roadNetwork.highwayColor));
  highway.setNumInstances(roadNetwork.highwayCount);

  street.setInstanceVBOs(new Float32Array(roadNetwork.streetTranslate), new Float32Array(roadNetwork.streetRotate), new Float32Array(roadNetwork.streetScale), new Float32Array(roadNetwork.streetColor));
  street.setNumInstances(roadNetwork.streetCount);
}

function createBuildings() {
  cubeBuildings.setInstanceVBOs(new Float32Array(buildings.cubeTranslate), new Float32Array(buildings.cubeRotate), new Float32Array(buildings.cubeScale), new Float32Array(buildings.cubeColor));
  cubeBuildings.setNumInstances(buildings.cubeCount);

  pentagonBuildings.setInstanceVBOs(new Float32Array(buildings.pentagonTranslate), new Float32Array(buildings.pentagonRotate), new Float32Array(buildings.pentagonScale), new Float32Array(buildings.pentagonColor));
  pentagonBuildings.setNumInstances(buildings.pentagonCount);

  hexagonBuildings.setInstanceVBOs(new Float32Array(buildings.hexagonTranslate), new Float32Array(buildings.hexagonRotate), new Float32Array(buildings.hexagonScale), new Float32Array(buildings.hexagonColor));
  hexagonBuildings.setNumInstances(buildings.hexagonCount);
}

function noise(p: vec2) {
  let val: number = Math.abs(Math.sin((p[0] * 10.0 - 300.0) * 654.987 + (p[1] * 10.0 - 300.0) * 456.123) * 43545.8573);
  return val - Math.floor(val);
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

  // gui.add(controls, 'Regenerate');
  // gui.add(controls, 'highwayDensity', 0.2, 2).name("Highway Density");
  // gui.add(controls, 'streetDensity', 1, 3).name("Street Density");
  // gui.add(controls, 'populationThreshold', 0, 2).name("Population Threshold");
  // gui.add(controls, 'randomSeed', -1000, 1000).name("Random Seed");
  // gui.add(controls, 'checkered').name("Checkered Road Networking");
  //
  // var showHeightController = gui.add(controls, 'showHeight').name("Show Height").listen();
  // showHeightController.onChange(function(value: boolean){
  //   controls.showHeight = true;
  //   controls.showPopulation = false;
  //   controls.showBoth = false;
  // });
  //
  // var showPopulationController = gui.add(controls, 'showPopulation').name("Show Population").listen();
  // showPopulationController.onChange(function(value: boolean){
  //   controls.showHeight = false;
  //   controls.showPopulation = true;
  //   controls.showBoth = false;
  // });
  //
  // var showBothController = gui.add(controls, 'showBoth').name("Show Both").listen();
  // showBothController.onChange(function(value: boolean){
  //   controls.showHeight = false;
  //   controls.showPopulation = false;
  //   controls.showBoth = true;
  // });

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

  const camera = new Camera(vec3.fromValues(0, -500, 0), vec3.fromValues(0, -10, 50));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  //gl.enable(gl.BLEND);
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

  const terrainShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
  ]);

  const buildingShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/building-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/building-frag.glsl')),
  ]);

  const skyShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/sky-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/sky-frag.glsl')),
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

  rasterizedGrid = new Array(height / gridDensity);
  for (let i: number = 0; i < rasterizedGrid.length; i++) {
    rasterizedGrid[i] = new Array(width / gridDensity);
  }

  let buildingWidth: number = 15 * gridDensity / (2 * width);
  let highwayWidthSq: number = (roadNetwork.highwayDimensions[0] + buildingWidth / 2) * (roadNetwork.highwayDimensions[0] + buildingWidth / 2);
  let streetWidthSq: number = (0.5 / roadNetwork.streetDensity * roadNetwork.highwayDimensions[0] + buildingWidth / 2) * (0.5 / roadNetwork.streetDensity * roadNetwork.highwayDimensions[0] + buildingWidth / 2);

  for (let i: number = 0; i < rasterizedGrid.length; i++) {
    for (let j: number = 0; j < rasterizedGrid[0].length; j++) {
      rasterizedGrid[i][j] = 1;
      if (roadNetwork.terrain.heightField(vec2.fromValues(2 * (i + 0.5) / rasterizedGrid.length - 1, 2 * (j + 0.5) / rasterizedGrid[0].length - 1)) <= 0) {
        rasterizedGrid[i][j] = 0;
        continue;
      }

      let newEdge: Edge = new Edge(vec2.fromValues(2 * i / rasterizedGrid.length - 1, 2 * (j + 0.5) / rasterizedGrid[0].length - 1), vec2.fromValues(2 * (i + 1) / rasterizedGrid.length - 1, 2 * (j + 0.5) / rasterizedGrid[0].length - 1));
      let k: number = Math.ceil(0.4 / roadNetwork.highwayDimensions[1]);
      let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
      let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);
      if (x >= 0 && x < k && y >= 0 && y < k) {
        let roadFound: boolean = false;
        for (let m : number = Math.max(0, x - 2); m <= Math.min(k - 1, x + 2); m++) {
          for (let n : number = Math.max(0, y - 2); n <= Math.min(k - 1, y + 2); n++) {
            let index: number = m * k + n;
            if (!roadFound) {
              for (let o: number = 0; o < roadNetwork.highwayEdges[index].length; o++) {
                let otherEdge: Edge = roadNetwork.highwayEdges[index][o];
                if (otherEdge.sqDistToPoint(vec2.fromValues(2 * (i + 0.5) / rasterizedGrid.length - 1, 2 * (j + 0.5) / rasterizedGrid[0].length - 1)) < highwayWidthSq) {
                  rasterizedGrid[i][j] = 0;
                  roadFound = true;
                  break;
                }
              }
            }

            if (!roadFound) {
              for (let o: number = 0; o < roadNetwork.streetEdges[index].length; o++) {
                let otherEdge: Edge = roadNetwork.streetEdges[index][o];
                if (otherEdge.sqDistToPoint(vec2.fromValues(2 * (i + 0.5) / rasterizedGrid.length - 1, 2 * (j + 0.5) / rasterizedGrid[0].length - 1)) < streetWidthSq) {
                  rasterizedGrid[i][j] = 0;
                  roadFound = true;
                  break;
                }
              }
            }
            if (roadFound) {
              break;
            }
          }
          if (roadFound) {
            break;
          }
        }
      }
    }
  }

  for (let i: number = 0; i < rasterizedGrid.length; i++) {
    for (let j: number = 0; j < rasterizedGrid[0].length; j++) {
      if (rasterizedGrid[i][j] == 1) {
        let coords: vec2 = vec2.fromValues(2 * (i + 0.5) / rasterizedGrid.length - 1, 2 * (j + 0.5) / rasterizedGrid[0].length - 1);
        if (noise(coords) > 1.0 - buildingDensity && roadNetwork.terrain.populationDensity(coords) > 0) {
          rasterizedGrid[i][j] = 2;
        }
      }
    }
  }

  houseGrid = new Array(height / houseDensity);
  for (let i: number = 0; i < houseGrid.length; i++) {
    houseGrid[i] = new Array(width / houseDensity);
  }

  let houseWidth: number = 3 * houseDensity / (2 * width);
  highwayWidthSq = (2 * roadNetwork.highwayDimensions[0] + houseWidth / 2) * (2 * roadNetwork.highwayDimensions[0] + houseWidth / 2);
  streetWidthSq = (0.5 / roadNetwork.streetDensity * roadNetwork.highwayDimensions[0] + houseWidth / 2) * (0.5 / roadNetwork.streetDensity * roadNetwork.highwayDimensions[0] + houseWidth / 2);

  for (let i: number = 0; i < houseGrid.length; i++) {
    for (let j: number = 0; j < houseGrid[0].length; j++) {
      houseGrid[i][j] = 1;
      if (roadNetwork.terrain.heightField(vec2.fromValues(2 * (i + 0.5) / houseGrid.length - 1, 2 * (j + 0.5) / houseGrid[0].length - 1)) <= 0) {
        houseGrid[i][j] = 0;
        continue;
      }

      let newEdge: Edge = new Edge(vec2.fromValues(2 * i / houseGrid.length - 1, 2 * (j + 0.5) / houseGrid[0].length - 1), vec2.fromValues(2 * (i + 1) / houseGrid.length - 1, 2 * (j + 0.5) / houseGrid[0].length - 1));
      let k: number = Math.ceil(0.4 / roadNetwork.highwayDimensions[1]);
      let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
      let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);
      if (x >= 0 && x < k && y >= 0 && y < k) {
        let roadFound: boolean = false;
        for (let m : number = Math.max(0, x - 2); m <= Math.min(k - 1, x + 2); m++) {
          for (let n : number = Math.max(0, y - 2); n <= Math.min(k - 1, y + 2); n++) {
            let index: number = m * k + n;
            if (!roadFound) {
              for (let o: number = 0; o < roadNetwork.highwayEdges[index].length; o++) {
                let otherEdge: Edge = roadNetwork.highwayEdges[index][o];
                if (otherEdge.sqDistToPoint(vec2.fromValues(2 * (i + 0.5) / houseGrid.length - 1, 2 * (j + 0.5) / houseGrid[0].length - 1)) < highwayWidthSq) {
                  houseGrid[i][j] = 0;
                  roadFound = true;
                  break;
                }
              }
            }

            if (!roadFound) {
              for (let o: number = 0; o < roadNetwork.streetEdges[index].length; o++) {
                let otherEdge: Edge = roadNetwork.streetEdges[index][o];
                if (otherEdge.sqDistToPoint(vec2.fromValues(2 * (i + 0.5) / houseGrid.length - 1, 2 * (j + 0.5) / houseGrid[0].length - 1)) < streetWidthSq) {
                  houseGrid[i][j] = 0;
                  roadFound = true;
                  break;
                }
              }
            }
            if (roadFound) {
              break;
            }
          }
          if (roadFound) {
            break;
          }
        }
      }
    }
  }

  mediumGrid = new Array(height / mediumDensity);
  for (let i: number = 0; i < mediumGrid.length; i++) {
    mediumGrid[i] = new Array(width / mediumDensity);
  }

  let mediumWidth: number = 5 * mediumDensity / (2 * width);
  highwayWidthSq = (roadNetwork.highwayDimensions[0] + mediumWidth / 2) * (roadNetwork.highwayDimensions[0] + mediumWidth / 2);
  streetWidthSq = (1.0 / roadNetwork.streetDensity * roadNetwork.highwayDimensions[0] + mediumWidth / 2) * (1.0 / roadNetwork.streetDensity * roadNetwork.highwayDimensions[0] + mediumWidth / 2);

  for (let i: number = 0; i < mediumGrid.length; i++) {
    for (let j: number = 0; j < mediumGrid[0].length; j++) {
      mediumGrid[i][j] = 1;
      if (roadNetwork.terrain.heightField(vec2.fromValues(2 * (i + 0.5) / mediumGrid.length - 1, 2 * (j + 0.5) / mediumGrid[0].length - 1)) <= 0) {
        mediumGrid[i][j] = 0;
        continue;
      }

      let newEdge: Edge = new Edge(vec2.fromValues(2 * i / mediumGrid.length - 1, 2 * (j + 0.5) / mediumGrid[0].length - 1), vec2.fromValues(2 * (i + 1) / mediumGrid.length - 1, 2 * (j + 0.5) / mediumGrid[0].length - 1));
      let k: number = Math.ceil(0.4 / roadNetwork.highwayDimensions[1]);
      let x: number = Math.floor((newEdge.midpoint[0] + 1.0) * k / 2.0);
      let y: number = Math.floor((newEdge.midpoint[1] + 1.0) * k / 2.0);
      if (x >= 0 && x < k && y >= 0 && y < k) {
        let roadFound: boolean = false;
        for (let m : number = Math.max(0, x - 2); m <= Math.min(k - 1, x + 2); m++) {
          for (let n : number = Math.max(0, y - 2); n <= Math.min(k - 1, y + 2); n++) {
            let index: number = m * k + n;
            if (!roadFound) {
              for (let o: number = 0; o < roadNetwork.highwayEdges[index].length; o++) {
                let otherEdge: Edge = roadNetwork.highwayEdges[index][o];
                if (otherEdge.sqDistToPoint(vec2.fromValues(2 * (i + 0.5) / mediumGrid.length - 1, 2 * (j + 0.5) / mediumGrid[0].length - 1)) < highwayWidthSq) {
                  mediumGrid[i][j] = 0;
                  roadFound = true;
                  break;
                }
              }
            }

            if (!roadFound) {
              for (let o: number = 0; o < roadNetwork.streetEdges[index].length; o++) {
                let otherEdge: Edge = roadNetwork.streetEdges[index][o];
                if (otherEdge.sqDistToPoint(vec2.fromValues(2 * (i + 0.5) / mediumGrid.length - 1, 2 * (j + 0.5) / mediumGrid[0].length - 1)) < streetWidthSq) {
                  mediumGrid[i][j] = 0;
                  roadFound = true;
                  break;
                }
              }
            }
            if (roadFound) {
              break;
            }
          }
          if (roadFound) {
            break;
          }
        }
      }
    }
  }

  for (let i: number = 0; i < mediumGrid.length; i++) {
    for (let j: number = 0; j < mediumGrid[0].length; j++) {
      if (mediumGrid[i][j] == 1) {
        let coords: vec2 = vec2.fromValues(2 * (i + 0.5) / mediumGrid.length - 1, 2 * (j + 0.5) / mediumGrid[0].length - 1);
        if (noise(coords) > 1.0 - buildingDensity && roadNetwork.terrain.populationDensity(coords) > 0) {
          mediumGrid[i][j] = 2;
        }
      }
    }
  }

  buildings = new Buildings(rasterizedGrid, houseGrid, mediumGrid, roadNetwork, buildingWidth, houseWidth, mediumWidth);
  buildings.createBuildings();
  createBuildings();

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
      terrainShader.setMapState(0);
    } else if (controls.showPopulation) {
      terrainShader.setMapState(1);
    } else if (controls.showBoth) {
      terrainShader.setMapState(2);
    }

    renderer.render(camera, skyShader, [
      sky
    ]);
    renderer.render(camera, terrainShader, [
      plane
    ]);
    renderer.render(camera, instancedShader, [
      highway,
      street
    ]);
    renderer.render(camera, buildingShader, [
      cubeBuildings,
      pentagonBuildings,
      hexagonBuildings
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
    skyShader.setDimensions(width, height);
  }, false);

  renderer.setSize(width, height);
  camera.setAspectRatio(width / height);
  camera.updateProjectionMatrix();
  flat.setDimensions(width, height);
  skyShader.setDimensions(width, height);

  // Start the render loop
  tick();
}

main();
