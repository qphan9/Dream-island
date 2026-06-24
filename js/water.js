import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';

export function createWater(scene, sunLight) {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: sunLight.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x006b8f, 
        distortionScale: 3.5,
        transparent: true,
        opacity: 0.85,
        fog: scene.fog !== undefined
    });
    water.rotation.x = -Math.PI / 2;
    water.position.y = 5; 
    scene.add(water);

    return water;
}
