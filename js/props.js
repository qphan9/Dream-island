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
    // Khởi tạo định vị bến (dock)
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
    dockGroup.rotation.y = -Math.PI / 1.18; 
    scene.add(dockGroup);

    // ==========================================================
    // TẢI CÁC FILE BOAT.GLB VÀ QUẢN LÝ HOẠT ẢNH NỘI BỘ
    // ==========================================================
    const boatContainer = new THREE.Group();
    scene.add(boatContainer);

    // Mảng lưu trữ tất cả các thuyền sau khi tải thành công để cập nhật hoạt ảnh
    const activeBoats = [];

    // CẤU HÌNH CHO TỪNG THUYỀN (Bạn chỉnh sửa vị trí và scale độc lập ở đây)
    const boatConfigs = [
        {
            path: 'glb/boat1.glb',
            pos: [50, 5.15, -60],        //  trí [X, Y, Z] gần cầu cảng
            rotY: -Math.PI / 1.2,        // Góc xoay quanh trục Y
            scale: [0.01, 0.01, 0.01],   // Tỷ lệ kích thước [X, Y, Z] của thuyền
            waveOffset: 0                // Độ lệch nhịp sóng dập dềnh
        },
        {
            path: 'glb/boat2.glb',
            pos: [-300, 5.15, -100],        
            rotY: Math.PI / 4,
            scale: [1.5, 1.5, 1.5],
            waveOffset: Math.PI / 3 
        },
        {
            path: 'glb/boat3.glb',
            pos: [-250, 15, 100],     
            rotY: -Math.PI / 6,
            scale: [50, 50, 50], 
            waveOffset: Math.PI / 1.5
        }
    ];

    // Vòng lặp tự động dựa trên mảng cấu hình
    boatConfigs.forEach(config => {
        loader.load(config.path, (gltf) => {
            const boatModel = gltf.scene;
            
            // Thiết lập scale độc lập từ thông số cấu hình riêng từng thuyền
            boatModel.scale.set(config.scale[0], config.scale[1], config.scale[2]);
            
            // Đặt vị trí cố định trên mặt nước (không bị trôi tự do)
            boatModel.position.set(config.pos[0], config.pos[1], config.pos[2]); 
            boatModel.rotation.y = config.rotY; 
            
            boatModel.castShadow = true;
            boatModel.traverse((child) => {
                if (child.isMesh) child.castShadow = true;
            });

            boatContainer.add(boatModel);
            
            // Đẩy vào mảng cập nhật để xử lý dập dềnh lệch pha
            activeBoats.push({
                model: boatModel,
                waveOffset: config.waveOffset,
                baseY: config.pos[1]
            });
        }, undefined, (error) => {
            console.error(`Lỗi khi load mô hình ${config.path} tại props.js:`, error);
        });
    });

    // Hàm cập nhật trạng thái hoạt ảnh dập dềnh tại chỗ cho toàn bộ thuyền
    function updateBoat(time) {
        activeBoats.forEach(boat => {
            if (boat.model) {
                // Nhấp nhô mượt mà tại chỗ dựa trên gốc tọa độ baseY và waveOffset
                boat.model.position.y = boat.baseY + Math.sin(time * 1.5 + boat.waveOffset) * 0.12;
                
                // Các hiệu ứng nghiêng lắc nhẹ theo nhịp sóng riêng
                boat.model.rotation.z = Math.sin(time * 2.0 + boat.waveOffset) * 0.04;
                boat.model.rotation.x = Math.cos(time * 1.5 + boat.waveOffset) * 0.02;
            }
        });
    }

    // Trả về woodTexture và hàm updateBoat để tương thích hoàn toàn với main.js cũ
    return { woodTexture, updateBoat };
}
