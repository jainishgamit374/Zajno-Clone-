import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import GUI from "lil-gui";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 20;

// Renderer setup with optimized settings
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#draw"),
  antialias: true, // Enable antialiasing for smoother edges
  alpha: true,
  powerPreference: "high-performance" // Request high performance GPU
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Post-processing setup with optimized settings
const renderScene = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);

// Bloom effect with optimized settings
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), // Lower resolution for better performance
  0.5,
  0.3,
  0.9
);
bloomPass.threshold = 0.9;
bloomPass.strength = 0.5;
bloomPass.radius = 0.3;
composer.addPass(bloomPass);

// Mesh setup with optimized geometry
const geometry = new THREE.TorusKnotGeometry(4, 1, 60, 8, 7, 19);
const material = new THREE.MeshStandardMaterial({
  color: "#f17ad4",
  metalness: 0.7,
  roughness: 0.1,
  envMapIntensity: 1
});
const torusKnot = new THREE.Mesh(geometry, material);
torusKnot.position.y = -8;
torusKnot.castShadow = true;
torusKnot.receiveShadow = true;
scene.add(torusKnot);

// Particles setup with optimized count
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 3000; // Reduced particle count
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 50;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.05,
  color: '#f17ad4',
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Environment setup with loading manager
const loadingManager = new THREE.LoadingManager();
const rgbeLoader = new RGBELoader(loadingManager);
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/rosendal_plains_1_2k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = null;
  }
);

// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.target.copy(torusKnot.position);

// Animation with RAF optimization
const clock = new THREE.Clock();
let animationFrameId;

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  torusKnot.rotation.set(elapsedTime * 0.5, elapsedTime * 0.2, 0);
  
  // Animate particles with reduced calculations
  particlesMesh.rotation.y = elapsedTime * 0.1;
  particlesMesh.rotation.x = elapsedTime * 0.15;
  
  const positions = particlesGeometry.attributes.position.array;
  for(let i = 0; i < positions.length; i += 6) { // Update every other particle
    positions[i + 1] += Math.sin(elapsedTime + positions[i]) * 0.01;
  }
  particlesGeometry.attributes.position.needsUpdate = true;

  controls.update();
  composer.render();
}

// Optimized resize handler
let resizeTimeout;
function onWindowResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    composer.setSize(width, height);
    
    // Update bloom resolution
    bloomPass.resolution.set(width / 2, height / 2);
  }, 250); // Increased debounce time
}

window.addEventListener("resize", onWindowResize);

// GUI controls with optimized update handling
const gui = new GUI();
const bloomParams = {
  strength: 0.5,
  radius: 0.3,
  threshold: 0.9,
};

gui.add(bloomParams, "strength", 0, 3).onChange((value) => {
  cancelAnimationFrame(animationFrameId);
  bloomPass.strength = value;
  animate();
});

gui.add(bloomParams, "radius", 0, 1).onChange((value) => {
  cancelAnimationFrame(animationFrameId);
  bloomPass.radius = value;
  animate();
});

gui.add(bloomParams, "threshold", 0, 1).onChange((value) => {
  cancelAnimationFrame(animationFrameId);
  bloomPass.threshold = value;
  animate();
});

const materialParams = {
  color: "#f17ad4",
  metalness: 0.7,
  roughness: 0.1,
};

gui.addColor(materialParams, "color").onChange((value) => {
  material.color.set(value);
  particlesMaterial.color.set(value);
});

gui.add(materialParams, "metalness", 0, 1).onChange((value) => {
  material.metalness = value;
});

gui.add(materialParams, "roughness", 0, 1).onChange((value) => {
  material.roughness = value;
});

// Initialize animation
animate();
