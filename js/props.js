import * as THREE from 'three';

export function createProps(scene, loader) {
    // Hàm vẽ vân gỗ cho thuyền và cầu cảng
    function createWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#6e4a2d';
        context.fillRect(0, 0, 256, 256);
        
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

    // ==========================================================
    // KHỞI TẠO VÀ ĐỊNH VỊ BẾN (DOCK) NẰM Ở RÌA TRÁI ĐẢO
    // ==========================================================
    const dockGroup = new THREE.Group();
    const dockLength = 32; 
    const dockGeo = new THREE.BoxGeometry(4, 0.5, dockLength);
    const dockPlankMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.9 });
    const dockMesh = new THREE.Mesh(dockGeo, dockPlankMat);
    
    dockMesh.position.set(0, 5.7, dockLength / 2); // Cao hơn mặt nước y=5 một chút
    dockMesh.castShadow = true; dockMesh.receiveShadow = true;
    dockGroup.add(dockMesh);

    // Thêm chân cột đỡ cắm sâu xuống biển
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
        post.position.set(p[0], 2, p[1]);
        post.castShadow = true;
        dockGroup.add(post);
    });
    
    // Tọa độ bến nằm ở rìa bãi biển bên trái island
    dockGroup.position.set(-45, -0.5, 35); 
    dockGroup.rotation.y = -Math.PI / 1.8; // Hướng đâm thẳng ra biển biên rộng
    scene.add(dockGroup);

    // ==========================================================
    // TẢI FILE BOAT.GLB VÀ QUẢN LÝ HOẠT ẢNH NỘI BỘ
    // ==========================================================
    const boatContainer = new THREE.Group();
    scene.add(boatContainer);

    let boatModel = null;

    loader.load('glb/boat.glb', (gltf) => {
        boatModel = gltf.scene;
        boatModel.scale.set(0.01, 0.01, 0.01);
        boatModel.position.set(60, 5.15, -100); 
        boatModel.rotation.y = -Math.PI / 1.2; 
        
        boatModel.castShadow = true;
        boatModel.traverse((child) => {
            if (child.isMesh) child.castShadow = true;
        });

        boatContainer.add(boatModel);
    }, undefined, (error) => {
        console.error('Lỗi khi load mô hình boat.glb tại props.js:', error);
    });

    // Hàm cập nhật trạng thái hoạt ảnh dập dềnh của thuyền theo thời gian
    // Hàm này sẽ được main.js liên tục gọi trong vòng lặp animate
    function updateBoat(time) {
        if (boatModel) {
            // Nổi dập dềnh toán học mượt mà quanh trục mặt nước y = 5 ngoài biển trống
            boatModel.position.y = 5.15 + Math.sin(time * 1.5) * 0.12;
            
            // Các hiệu ứng nghiêng lắc nhẹ mượt mà theo sóng nước
            boatModel.rotation.z = Math.sin(time * 2.0) * 0.04;
            boatModel.rotation.x = Math.cos(time * 1.5) * 0.02;
        }
    }

    // Trả về woodTexture và hàm updateBoat để main.js sử dụng
    return { woodTexture, updateBoat };
}
