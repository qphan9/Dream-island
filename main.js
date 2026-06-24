import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// IMPORT CÁC MODULE ĐÃ ĐƯỢC TÁCH RA
import { createLighting } from './js/lighting.js';
import { createWater } from './js/water.js';
import { createTerrain } from './js/terrain.js';
import { spawnEcosystem } from './js/ecosystem.js';
import { createProps } from './js/props.js';
import { createVFX, updateVFX } from './js/vfx.js';
import { initGUI } from './js/gui.js';

// ==========================================
// 1. KHỞI TẠO KHÔNG GIAN (Giữ trực tiếp trong main.js theo yêu cầu)
// ==========================================
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xfffaf0, 0.0025); 

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.set(0, 80, 160);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.toneMapping = THREE.ACESFilmicToneMapping; 
renderer.toneMappingExposure = 0.95; 
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.47; 

// ==========================================
// 2. KHỞI TẠO CÁC PHÂN ĐOẠN ĐƯỢC TÁCH MODULE
// ==========================================
const { sunLight, sunMesh, sunMat } = createLighting(scene);
const water = createWater(scene, sunLight);
const { island, pos } = createTerrain(scene);
spawnEcosystem(scene, pos);
const { woodTexture, boatGroup, hull } = createProps(scene);
const { cloudGroup, particles, lavaParticles, lavaSpeeds, lavaCount } = createVFX(scene);
initGUI(water, sunLight, sunMat, hull);

// ==========================================
// 3. RENDER LOOP & RESIZE EVENT
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    water.material.uniforms['time'].value += 1.0 / 60.0;
    
    // Thuyền dập dềnh bám theo mực nước hiện tại được set trong GUI
    boatGroup.position.y = Math.sin(time * 2) * 0.2; 
    boatGroup.rotation.z = Math.cos(time * 1.5) * 0.05;

    // Cập nhật mây bay, đom đóm & tàn lửa
    updateVFX(cloudGroup, particles, lavaParticles, lavaSpeeds, lavaCount, time);

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});