import * as THREE from 'three';

export function createVFX(scene) {
    const cloudGroup = new THREE.Group();
    // Vô hiệu hoá mây low-poly cũ để nhường chỗ cho Volumetric Clouds
    // scene.add(cloudGroup);

    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 160;
        particlePositions[i + 1] = 5 + Math.random() * 30;
        particlePositions[i + 2] = (Math.random() - 0.5) * 160;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xffe699, size: 0.4, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const lavaCount = 120;
    const lavaGeo = new THREE.BufferGeometry();
    const lavaPositions = new Float32Array(lavaCount * 3);
    const lavaSpeeds = [];

    for (let i = 0; i < lavaCount; i++) {
        lavaPositions[i * 3] = (Math.random() - 0.5) * 4;
        lavaPositions[i * 3 + 1] = 20.5 + Math.random() * 2; 
        lavaPositions[i * 3 + 2] = (Math.random() - 0.5) * 4;

        lavaSpeeds.push({
            x: (Math.random() - 0.5) * 0.25,
            y: 0.35 + Math.random() * 0.4, 
            z: (Math.random() - 0.5) * 0.25
        });
    }
    lavaGeo.setAttribute('position', new THREE.BufferAttribute(lavaPositions, 3));
    const lavaMat = new THREE.PointsMaterial({ color: 0xff4500, size: 1.3, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const lavaParticles = new THREE.Points(lavaGeo, lavaMat);
    scene.add(lavaParticles);

    return { cloudGroup, particles, lavaParticles, lavaSpeeds, lavaCount };
}

export function updateVFX(cloudGroup, particles, lavaParticles, lavaSpeeds, lavaCount, time) {
    cloudGroup.children.forEach((cloud, index) => {
        cloud.position.x += 0.015 * (index % 2 === 0 ? 1 : -1);
        if (cloud.position.x > 150) cloud.position.x = -150;
        if (cloud.position.x < -150) cloud.position.x = 150;
    });

    particles.rotation.y = time * 0.015;

    const lavaPosArr = lavaParticles.geometry.attributes.position.array;
    for (let i = 0; i < lavaCount; i++) {
        lavaPosArr[i * 3] += lavaSpeeds[i].x;     
        lavaPosArr[i * 3 + 1] += lavaSpeeds[i].y; 
        lavaPosArr[i * 3 + 2] += lavaSpeeds[i].z; 
        lavaSpeeds[i].y -= 0.012; 

        if (lavaPosArr[i * 3 + 1] < 19 || lavaPosArr[i * 3 + 1] > 65) {
            lavaPosArr[i * 3] = (Math.random() - 0.5) * 4;
            lavaPosArr[i * 3 + 1] = 20.5; 
            lavaPosArr[i * 3 + 2] = (Math.random() - 0.5) * 4;
            lavaSpeeds[i].y = 0.35 + Math.random() * 0.4; 
        }
    }
    lavaParticles.geometry.attributes.position.needsUpdate = true;
}
