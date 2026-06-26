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
import { CloudsRenderer } from './js/volumetricClouds/CloudsRenderer.js';

// ==========================================
// 1. KHỞI TẠO HỆ THỐNG GỐC (CORE)
// ==========================================
const scene = new THREE.Scene();
//scene.fog = new THREE.FogExp2(0xfffaf0, 0.0025); 

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

const loader = new GLTFLoader();
const clock = new THREE.Clock();

// ==========================================
// 2. ÁNH SÁNG & BẦU TRỜI (ENVIRONMENT)
// ==========================================
const { sky, sunLight, ambientLight, toggleTime, update: updateLighting } = createLighting(scene);

// ==========================================
// 3. THỰC THỂ & HỆ SINH THÁI (OBJECTS & ECOSYSTEM)
// ==========================================
const { water, updateFishes } = createWater(scene, sunLight, loader);
const { island, pos } = createTerrain(scene);
spawnEcosystem(scene, pos);
const { woodTexture, updateBoat } = createProps(scene, loader);

// ==========================================
// 4. HIỆU ỨNG HÌNH ẢNH (VFX & VOLUMETRIC CLOUDS)
// ==========================================
const { cloudGroup, particles, lavaParticles, lavaSpeeds, lavaCount } = createVFX(scene);

// Thiết lập vùng chứa mây tích thể
const cloudBoxGeo = new THREE.BoxGeometry(300, 200, 300);
const cloudBoxMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
const cloudBoxMesh = new THREE.Mesh(cloudBoxGeo, cloudBoxMat);
cloudBoxMesh.position.set(0, 100, 0); // Đặt mây ở độ cao 100
scene.add(cloudBoxMesh);

const size = { width: window.innerWidth, height: window.innerHeight };
const cloudsRenderer = new CloudsRenderer(renderer, size);

// ==========================================
// 5. GIAO DIỆN ĐIỀU KHIỂN (GUI)
// ==========================================
initGUI(water, toggleTime);

// ==========================================
// 6. VÒNG LẶP HOẠT HỌA (ANIMATION LOOP)
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Cập nhật mặt nước
    if (water && water.material.uniforms['time']) {
        water.material.uniforms['time'].value += 1.0 / 60.0;
    }

    // Cập nhật chuyển động của thuyền & cá
    if (typeof updateBoat === 'function') {
        updateBoat(time);
    }
    
    if (typeof updateFishes === 'function') {
        updateFishes(delta, time);
    }

    // Cập nhật môi trường & hiệu ứng hạt
    updateLighting();
    updateVFX(cloudGroup, particles, lavaParticles, lavaSpeeds, lavaCount, time);

    // Xử lý Render pass (Nền tảng mây tích thể)
    renderer.autoClear = false;
    renderer.clear();
    
    renderer.render(scene, camera);
    cloudsRenderer.render(1.0 / 60.0, cloudBoxMesh, camera, scene);

    controls.update();
}

// Bắt đầu chạy ứng dụng
animate();

// ==========================================
// 7. SỰ KIỆN HỆ THỐNG (LISTENERS)
// ==========================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cloudsRenderer.resize({ width: window.innerWidth, height: window.innerHeight });
});
