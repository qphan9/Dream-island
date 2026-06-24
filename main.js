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

// Khởi tạo loader dùng chung
const loader = new GLTFLoader();

// Khởi tạo raycaster để tìm độ cao mặt nước bằng tia vertical
const raycaster = new THREE.Raycaster();
const downDirection = new THREE.Vector3(0, -1, 0);

// ==========================================
// 2. KHỞI TẠO CÁC PHÂN ĐOẠN ĐƯỢC TÁCH MODULE
// ==========================================
const { sunLight, sunMesh, sunMat } = createLighting(scene);
const water = createWater(scene, sunLight);
const { island, pos } = createTerrain(scene);
spawnEcosystem(scene, pos);

const { woodTexture, boatContainer } = createProps(scene, loader);

const { cloudGroup, particles, lavaParticles, lavaSpeeds, lavaCount } = createVFX(scene);
initGUI(water, sunLight, sunMat, null);


// ==========================================
// 3. RENDER LOOP & RESIZE EVENT
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    // Cập nhật thời gian trôi cho shader nước
    if (water && water.material.uniforms['time']) {
        water.material.uniforms['time'].value += 1.0 / 60.0;
    }
    
    // XỬ LÝ CHO THUYỀN GLB NỔI TỰ NHIÊN TRÊN MẶT NƯỚC
    if (boatContainer && boatContainer.children.length > 0 && water) {
        const boat = boatContainer.children[0]; 
        
        // Tạo điểm xuất phát của tia ngay phía trên thuyền (Y = 150)
        const rayOrigin = new THREE.Vector3(boat.position.x, 150, boat.position.z);
        raycaster.set(rayOrigin, downDirection);
        
        const intersects = raycaster.intersectObject(water, true);
        
        if (intersects.length > 0) {
            const hitPoint = intersects[0].point;
            // Ép tọa độ Y bám theo điểm va chạm + offset chìm nhẹ dưới nước (0.15)
            boat.position.y = hitPoint.y + 0.15;
            
            // Thêm hiệu ứng lắc lư dập dềnh nhẹ theo thời gian cho sinh động
            boat.rotation.z = Math.sin(time * 2.0) * 0.04;
            boat.rotation.x = Math.cos(time * 1.5) * 0.02;
        } else {
            // Khử lỗi lơ lửng: Nếu tia không bắt được lưới, ép thuyền dập dềnh toán học quanh mặt nước y=5
            boat.position.y = 5.15 + Math.sin(time * 1.5) * 0.12; 
            boat.rotation.z = Math.sin(time * 2.0) * 0.04;
            boat.rotation.x = Math.cos(time * 1.5) * 0.02;
        }
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
