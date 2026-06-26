import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';

export function createWater(scene, sunLight, loader) {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: sunLight.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x33a6cc, 
        distortionScale: 1.5,
        transparent: true,
        opacity: 0.6,
        fog: scene.fog !== undefined
    });
    water.rotation.x = -Math.PI / 2;
    water.position.y = 5; 
    scene.add(water);

    // ==========================================================
    // QUẢN LÝ ĐÀN CÁ BƠI THEO HÌNH CHỮ NHẬT BO TRÒN (SQUIRCLE)
    // ==========================================================
    let localFishGroup = null;
    const fishSubMeshes = []; 

    const centerPoint = { x: 70, y: 1.5, z: -110 }; 
    const fishScale = [4, 4, 4]; 

    // Cấu hình kích thước hình chữ nhật bo tròn
    const rectLengthX = 35; // Chiều dài đoạn chạy thẳng X
    const rectWidthZ = 15;  // Chiều rộng đoạn chạy thẳng Z

    loader.load('glb/fish.glb', (gltf) => {
        localFishGroup = gltf.scene;
        
        localFishGroup.position.set(centerPoint.x, centerPoint.y, centerPoint.z);
        localFishGroup.scale.set(fishScale[0], fishScale[1], fishScale[2]); 

        localFishGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                fishSubMeshes.push(child);
            }
        });

        scene.add(localFishGroup);
    }, undefined, (error) => {
        console.error("Lỗi khi tải mô hình cá:", error);
    });

    let targetRotationY = 0;
    let currentRotationY = 0;

    function updateFishes(delta, totalTime) {
        const time = totalTime || Date.now() * 0.001; 

        if (localFishGroup) {
            // Tốc độ bơi của đàn cá
            const speedFactor = 0.2; 
            const progress = (time * speedFactor) % (Math.PI * 2);

            const cosT = Math.cos(progress);
            const sinT = Math.sin(progress);
            
            // Bo tròn quỹ đạo
            const n = 0.6; 
            const factorX = Math.sign(cosT) * Math.pow(Math.abs(cosT), n);
            const factorZ = Math.sign(sinT) * Math.pow(Math.abs(sinT), n);

            // Tính tọa độ di chuyển hình chữ nhật bo góc
            const targetX = centerPoint.x + factorX * rectLengthX;
            const targetZ = centerPoint.z + factorZ * rectWidthZ;

            // Tính hướng đầu cá lượn theo đường bo cong
            const deltaX = targetX - localFishGroup.position.x;
            const deltaZ = targetZ - localFishGroup.position.z;

            if (Math.abs(deltaX) > 0.001 || Math.abs(deltaZ) > 0.001) {
                targetRotationY = Math.atan2(deltaX, deltaZ);
                
                let diff = targetRotationY - currentRotationY;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                currentRotationY += diff * 0.15; // Tăng hệ số nội suy để đầu cá quay mượt theo góc bo
                
                localFishGroup.rotation.y = currentRotationY;
            }

            // Đặt vị trí X và Z
            localFishGroup.position.x = targetX;
            localFishGroup.position.z = targetZ;
            localFishGroup.position.y = centerPoint.y; 
        }

        // Tạo hiệu ứng quẫy đuôi mềm mại tại chỗ (Vẫn giữ để cá không bị cứng đơ đơ như khúc gỗ)
        if (fishSubMeshes.length > 0) {
            fishSubMeshes.forEach((mesh, index) => {
                mesh.rotation.z = Math.sin(time * 7.0 + index * 0.4) * 0.08;
            });
        }
    }

    return { water, updateFishes };
}
