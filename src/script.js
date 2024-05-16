import { OrbitControls } from "https://unpkg.com/three@0.112/examples/jsm/controls/OrbitControls.js";
import * as THREE from "https://cdn.skypack.dev/three@0.151.3";
import * as SunCalc from "https://cdn.skypack.dev/suncalc@1.9.0";

// Renderer

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.gammaFactor = 2.2;
renderer.gammaOutput = true;
renderer.useLegacyLights = true;

renderer.shadowMap.enabled = true;
renderer.shadowMap.renderReverseSided = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function render() {
  renderer.render( scene, camera );
};

// Camera

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// Window

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  render();
};

// Controls

const controls = new OrbitControls( camera, renderer.domElement );

controls.enableDamping = true;
controls.dampingFactor = 0.1; 

controls.rotateSpeed = 0.25; 
controls.autoRotate = false; 

controls.enableZoom = true;

camera.position.z = 4;

// Sunlight

let userLatitude = 0;
let userLongitude = 0; // Equator by default
const timeScale = 500;

const sun = new THREE.Mesh(
  new THREE.SphereGeometry( 10, 32, 32 ),
  new THREE.MeshBasicMaterial( { color: 0xffff00 } )
);
const sunLight = new THREE.DirectionalLight( 0xffffff, 1.2 );

sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;

sunLight.shadow.bias = -0.0001;


scene.add( sun );
sun.add( sunLight );
scene.add( new THREE.CameraHelper( sunLight.shadow.camera ));

function updateSunPosition( userLatitude, userLongitude, currentTime ) {
  
  const scaledTime = currentTime * timeScale;
  const date = new Date(scaledTime);
  
  const times = SunCalc.getTimes( date, userLatitude, userLongitude );
  const sunPosition = SunCalc.getPosition( date, userLatitude, userLongitude );

  const elevation = sunPosition.altitude; // Angle above the horizon
  const azimuth = sunPosition.azimuth; // Angle measured from the North direction

  const distance = 150; // Distance from the center of the scene
  const x = distance * Math.cos( azimuth );
  const y = distance * Math.sin( elevation );
  const z = distance * Math.sin( azimuth );

  sun.position.set( x, y, z );
  
  // Shader Work
  const intensityFactor = Math.max(1 - Math.abs(elevation) / Math.PI, 0);
  sunLight.intensity = 1.3 * intensityFactor;
};

function updateSunlightDirection() {
  sunLight.position.copy(sun.position);
};

// Moonlight

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(8, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xaaaaaa
  })
);

scene.add( moon );

function updateMoonPosition(userLatitude, userLongitude, currentTime) {
  const scaledTime = currentTime * timeScale; 
  const date = new Date(scaledTime);
  
  const moonPosition = SunCalc.getMoonPosition( date, userLatitude, userLongitude );

  const moonDistance = 150; 
  const moonX = -moonDistance * Math.cos( moonPosition.azimuth );
  const moonY = moon.position.y; 
  const moonZ = -moonDistance * Math.sin( moonPosition.azimuth );

  moon.position.set( moonX, moonY, moonZ );
  
}

// Geometry

var plane1 = new THREE.Mesh( 
  new THREE.PlaneGeometry( 100, 100 ), 
  new THREE.MeshStandardMaterial({ color: 0x00ff00, 
                                   side: THREE.DoubleSide,
                                   transparent: false,
                                   opacity: 1
                                 })
);

const cube = new THREE.Mesh( 
  new THREE.BoxGeometry( 1, 3, 1 ),
  new THREE.MeshPhysicalMaterial({ color: '#d7e3fa' })
);

sunLight.target = plane1;
plane1.rotateX( -Math.PI / 2 );
plane1.position.set( 0, -1, 0 );
plane1.receiveShadow = true;


cube.position.set( 0, 1, 0 );
cube.castShadow = true;
cube.recieveShadow=true;

scene.add( plane1, cube );

// Animation

function animate( currentTime ) {
  updateSunPosition( userLatitude, userLongitude, currentTime );
  updateSunlightDirection();
  sunLight.shadow.camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  updateMoonPosition( userLatitude, userLongitude, currentTime );
  
  requestAnimationFrame( animate );
  controls.update();
  render();
};

animate(performance.now());
