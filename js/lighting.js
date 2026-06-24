import * as THREE from 'three';

export function createLighting(scene) {
    const ambientLight = new THREE.HemisphereLight(0xfff3d4, 0x404040, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4); 
    sunLight.position.set(120, 100, -80); // Đẩy mặt trời ra phía sau đảo một chút
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    const d = 140;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // VẼ MẶT TRỜI THẬT (Quả cầu phát sáng)
    const sunGeo = new THREE.SphereGeometry(10, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.copy(sunLight.position);

    // Tạo quầng sáng (Glow) quanh mặt trời
    const glowGeo = new THREE.SphereGeometry(18, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ 
        color: 0xffcc77, 
        transparent: true, 
        opacity: 0.4, 
        blending: THREE.AdditiveBlending 
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    sunMesh.add(glowMesh);
    scene.add(sunMesh);

    return { sunLight, sunMesh, sunMat };
}
