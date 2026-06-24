import * as THREE from 'three';

export function createProps(scene) {
    // Hàm vẽ vân gỗ cho thuyền và cầu cảng
    function createWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Màu nền gỗ
        context.fillStyle = '#6e4a2d';
        context.fillRect(0, 0, 256, 256);
        
        // Vẽ các sọc vân gỗ đậm màu
        context.fillStyle = '#4a2f1a';
        for (let i = 0; i < 50; i++) {
            context.globalAlpha = Math.random() * 0.6 + 0.2;
            context.fillRect(Math.random() * 256, 0, Math.random() * 4 + 1, 256);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    const woodTexture = createWoodTexture();

    const dockGroup = new THREE.Group();
    const dockGeo = new THREE.BoxGeometry(4, 0.5, 16);
    const dockPlankMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.9 });
    const dockMesh = new THREE.Mesh(dockGeo, dockPlankMat);
    dockMesh.position.set(0, 6, 8);
    dockMesh.castShadow = true; dockMesh.receiveShadow = true;
    dockGroup.add(dockMesh);

    const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 4);
    const postMat = new THREE.MeshStandardMaterial({ map: woodTexture });
    const positions = [[-1.5, 8], [1.5, 8], [-1.5, 14], [1.5, 14], [-1.5, 2], [1.5, 2]];
    positions.forEach(p => {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(p[0], 4.5, p[1]);
        post.castShadow = true;
        dockGroup.add(post);
    });
    dockGroup.position.set(20, 0, 45);
    dockGroup.rotation.y = -Math.PI / 6;
    scene.add(dockGroup);

    const boatGroup = new THREE.Group();
    const hullGeo = new THREE.BoxGeometry(3, 1.5, 8);
    const hullMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.8 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 5; 
    hull.castShadow = true;
    boatGroup.add(hull);
    boatGroup.position.set(35, 0, 50);
    boatGroup.rotation.y = Math.PI / 4;
    scene.add(boatGroup);

    return { woodTexture, boatGroup, hull };
}
