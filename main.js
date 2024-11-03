import * as THREE from "three";
import vertex from "./utils/Shaders/vertex.glsl";
import fragment from "./utils/Shaders/fragment.glsl";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis
const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Scene setup
const scene = new THREE.Scene();
const distance = 20;
const newfov = 2 * Math.atan((window.innerHeight / 2) / distance) * (180 / Math.PI);
const camera = new THREE.PerspectiveCamera(
  newfov,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.z = distance;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Object creation
const images = document.querySelectorAll("img");
const meshes = [];
images.forEach(image => {
  const imgbounds = image.getBoundingClientRect();
  const texture = new THREE.TextureLoader().load(image.src);
  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    uniforms: {
      uTexture: { value: texture },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 }
    },
  });
  const geometry = new THREE.PlaneGeometry(imgbounds.width, imgbounds.height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.img = image;
  mesh.position.set(imgbounds.left - window.innerWidth / 2 + imgbounds.width / 2, -imgbounds.top + window.innerHeight / 2 - imgbounds.height / 2, 0);
  meshes.push(mesh);
  scene.add(mesh);
});

// Renderer setup
const canvas = document.querySelector("#draw");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

function updatemeshPosition() {
  meshes.forEach((mesh) => {
    const image = mesh.userData.img;
    const imagebounds = image.getBoundingClientRect();
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(imagebounds.width, imagebounds.height);
    mesh.position.set(
      imagebounds.left - window.innerWidth / 2 + imagebounds.width / 2,
      -imagebounds.top + window.innerHeight / 2 - imagebounds.height / 2,
      0
    );
  });
}

// Window resize event listener
window.addEventListener("resize", function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updatemeshPosition();
});

// Animation function
const clock = new THREE.Clock();
function animate() {
  renderer.render(scene, camera);
  updatemeshPosition();
  requestAnimationFrame(animate);
}
animate();

lenis.on('scroll', updatemeshPosition);

// Check if the device is mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Only add mousemove listener if not on mobile
if (!isMobile) {
  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(meshes);

    meshes.forEach(mesh => {
      gsap.to(mesh.material.uniforms.uHover, { value: 0, duration: 0.3 });
    });

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const uv = intersect.uv;

      gsap.to(intersect.object.material.uniforms.uMouse.value, {
        x: uv.x,
        y: uv.y,
        duration: 0.3,
      });

      gsap.to(intersect.object.material.uniforms.uHover, {
        value: 1,
        duration: 0.3,
      });
    }
  });
}
