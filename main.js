import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// IMPORT CÁC MODULE ĐÃ ĐƯỢC TÁCH RA
import { createLighting } from './js/lighting.js';
import { createWater } from './js/water.js';
import { createTerrain } from './js/terrain.js';
import { spawnEcosystem } from './js/ecosystem.js';
import { createProps } from './js/props.js';
import { createVFX, updateVFX } from './js/vfx.js';
import { initGUI } from './js/gui.js';

// ==========================================
// 1. KHỞI TẠO KHÔNG GIAN
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

// KHỞI TẠO LOADER DÙNG CHUNG
const loader = new GLTFLoader();

// ==========================================
// 2. KHỞI TẠO CÁC PHÂN ĐOẠN ĐƯỢC TÁCH MODULE
// ==========================================
const { sunLight, sunMesh, sunMat } = createLighting(scene);
const water = createWater(scene, sunLight);
const { island, pos } = createTerrain(scene);
spawnEcosystem(scene, pos);

// NHẬN LẠI HÀM UPDATE CỦA THUYỀN TỪ PROPS
const { woodTexture, updateBoat } = createProps(scene, loader);

const { cloudGroup, particles, lavaParticles, lavaSpeeds, lavaCount } = createVFX(scene);
initGUI(water, sunLight, sunMat, null);

// ==========================================
// 3. RENDER LOOP & RESIZE EVENT
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    if (water && water.material.uniforms['time']) {
        water.material.uniforms['time'].value += 1.0 / 60.0;
    }
    
    // GỌI HOẠT ẢNH DẬP DỀNH CỦA THUYỀN ĐÃ ĐƯỢC ĐÓNG GÓI TRONG PROPS.JS
    if (typeof updateBoat === 'function') {
        updateBoat(time);
    }
    
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
