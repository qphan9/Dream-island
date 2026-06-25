import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export function createLighting(scene) {
    // ==========================================
    // 1. BIẾN TRẠNG THÁI
    // ==========================================

    const state = {
        isDay: false,
        currentElevation: -10 // Góc của mặt trời
    };
    const sunVector = new THREE.Vector3();

    // ==========================================
    // 2. KHỞI TẠO BẦU TRỜI THUẬT TOÁN
    // ==========================================
    const sky = new Sky();
    sky.scale.setScalar(450000); 
    scene.add(sky);

    // Các tham số điều chỉnh trời
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = 1.0;     // Độ đục  
    uniforms['rayleigh'].value = 1.5;      // Độ tán xạ ánh sáng: càng giảm càng xanh  
    uniforms['mieCoefficient'].value = 0.01;  // Độ nhoè tạo vùng sáng ở mặt trời
    uniforms['mieDirectionalG'].value = 0.7;  

    const azimuth = 180; 

    // ==========================================
    // 3. HỆ THỐNG ÁNH SÁNG & SƯƠNG MÙ
    // ==========================================

    // Ambient light
    const ambientLight = new THREE.HemisphereLight('#ffb6c1', '#006994', 2);
    scene.add(ambientLight);

    // Directional Light
    const sunLight = new THREE.DirectionalLight('#ff8c00', 2.0); 
    sunLight.castShadow = true;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Sương
    scene.fog = new THREE.FogExp2('#ff7e67', 0.00001); 

    // Cập nhật vị trí ban đầu của mặt trời
    updateSunPosition();

    function updateSunPosition() {
        const phi = THREE.MathUtils.degToRad(90 - state.currentElevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        sunVector.setFromSphericalCoords(1, phi, theta);
        
        uniforms['sunPosition'].value.copy(sunVector);
        sunLight.position.copy(sunVector).multiplyScalar(100);
    }

    // ==========================================
    // 4. CÁC HÀM ĐIỀU KHIỂN & VÒNG LẶP (CẬP NHẬT MỚI)
    // ==========================================
    function toggleTime() {
        state.isDay = !state.isDay;
    }

    function update() {
        // Ngày thì đứng ở 2 độ, Đêm thì chìm sâu xuống -10 độ
        const targetElevation = state.isDay ? 2 : -10;
        
        // Nội suy mượt mà vị trí mặt trời
        state.currentElevation = THREE.MathUtils.lerp(state.currentElevation, targetElevation, 0.005);
        updateSunPosition();

        // TÍNH TOÁN HỆ SỐ THỜI GIAN (0.0 là Đêm, 1.0 là Ngày)
        // Dùng clamp để ép giá trị luôn nằm trong khoảng 0 đến 1
        const factor = Math.max(0, Math.min(1, (state.currentElevation + 10) / 12));

        // 1. Chuyển đổi cường độ mặt trời chính
        sunLight.intensity = factor * 2.0;

        // 2. Chuyển đổi Đèn môi trường (Ambient)
        // Ngày: Hồng/Xanh dương (Cường độ 2.0) | Đêm: Xanh đen/Đen (Cường độ 0.5 để không bị tối mù)
        ambientLight.color.lerpColors(new THREE.Color('#050515'), new THREE.Color('#ffb6c1'), factor);
        ambientLight.groundColor.lerpColors(new THREE.Color('#010105'), new THREE.Color('#006994'), factor);
        ambientLight.intensity = 0.5 + (factor * 1);

        // 3. Chuyển đổi màu sương mù
        // Ngày: Cam rực | Đêm: Xanh đen tăm tối
        scene.fog.color.lerpColors(new THREE.Color('#020208'), new THREE.Color('#ffb6c1'), factor);
    }

    return { 
        sky, 
        sunLight, 
        ambientLight, 
        toggleTime, 
        update 
    };
}