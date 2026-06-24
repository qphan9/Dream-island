import * as THREE from 'three';

export function createProps(scene, loader) {
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
    
    // Kéo dài từ 16 lên 32 đơn vị
    const dockLength = 32; 
    const dockGeo = new THREE.BoxGeometry(4, 0.5, dockLength);
    const dockPlankMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.9 });
    const dockMesh = new THREE.Mesh(dockGeo, dockPlankMat);
    
    // Đặt vị trí tấm ván dock chạy dọc theo chiều dài nhóm
    dockMesh.position.set(0, 5.7, dockLength / 2); // 5.7 để ván bến cao hơn mặt nước y=5 một chút
    dockMesh.castShadow = true; dockMesh.receiveShadow = true;
    dockGroup.add(dockMesh);

    // Tăng chiều cao cột đỡ lên 8 đơn vị để cắm sâu xuống biển (Mặt nước của bạn ở y=5)
    const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 8); 
    const postMat = new THREE.MeshStandardMaterial({ map: woodTexture });
    const positions = [
        [-1.5, 2], [1.5, 2],
        [-1.5, dockLength * 0.35], [1.5, dockLength * 0.35],
        [-1.5, dockLength * 0.70], [1.5, dockLength * 0.70],
        [-1.5, dockLength - 2], [1.5, dockLength - 2]
    ];
    
    positions.forEach(p => {
        const post = new THREE.Mesh(postGeo, postMat);
        // Đặt tọa độ y của cột thụp xuống dưới để đỡ ván bến ở trên
        post.position.set(p[0], 2, p[1]);
        post.castShadow = true;
        dockGroup.add(post);
    });
    
    // Định vị bến nằm ở rìa đảo và hướng đâm thẳng ra ngoài biên biển
    dockGroup.position.set(-45, -0.5, 35); 
    dockGroup.rotation.y = -Math.PI / 1.8; 
    scene.add(dockGroup);

    // ==========================================
    // TẢI FILE BOAT.GLB VÀ ĐỊNH VỊ CẠNH BẾN
    // ==========================================
    const boatContainer = new THREE.Group();
    scene.add(boatContainer);

    loader.load('glb/boat.glb', (gltf) => {
        const boatModel = gltf.scene;
        
        boatModel.scale.set(0.007, 0.007, 0.007);
        boatModel.position.set(-80, 170, 55); 
        
        // Xoay hướng thuyền hơi lệch một chút so với bến nhìn cho tự nhiên
        boatModel.rotation.y = -Math.PI / 1.5; 
        
        boatModel.castShadow = true;
        boatModel.traverse((child) => {
            if (child.isMesh) child.castShadow = true;
        });

        boatContainer.add(boatModel);
    }, undefined, (error) => {
        console.error('Lỗi khi load mô hình boat.glb:', error);
    });

    return { woodTexture, boatContainer };
}
