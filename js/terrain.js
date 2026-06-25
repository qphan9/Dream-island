import * as THREE from 'three';

export function createTerrain(scene) {
    const simplex = new SimplexNoise();
    const islandSize = 240; 
    const segments = 300; 

    // ==========================================
    // 1. TẠO BUMP MAP CHÌM (LÀM BỀ MẶT ĐÁ CÁT SẦN SÙI TỰ NHIÊN)
    // ==========================================
    function createRockBumpMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        for(let x = 0; x < 512; x++) {
            for(let y = 0; y < 512; y++) {
                let v = Math.floor(Math.random() * 255);
                ctx.fillStyle = `rgb(${v},${v},${v})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(30, 30); 
        return tex;
    }

    // ==========================================
    // 2. TEXTURE DUNG NHAM GLOW ĐỎ RỰC TỪ TÂM (KHÔNG CẦN TẢI ẢNH)
    // ==========================================
    function createLavaTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Gradient dung nham siêu nóng
        const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, '#ffffff'); // Lõi trắng chói
        grad.addColorStop(0.15, '#ffea00'); // Vàng rực
        grad.addColorStop(0.5, '#ff2200'); // Đỏ cam
        grad.addColorStop(1, '#550000'); // Viền đỏ thẫm
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        
        // Đốm lửa và vảy đá đen
        for(let i = 0; i < 4500; i++) {
            ctx.fillStyle = Math.random() > 0.6 ? '#ffaa00' : '#110000'; 
            const size = Math.random() * 4 + 1;
            ctx.fillRect(Math.random()*512, Math.random()*512, size, size);
        }
        return new THREE.CanvasTexture(canvas);
    }

    const rockBump = createRockBumpMap();
    const lavaTex = createLavaTexture();

    const islandGeo = new THREE.PlaneGeometry(islandSize, islandSize, segments, segments);
    
    // Vật liệu nền đảo: Bắt sáng mượt, sần sùi nhẹ nhàng
    const islandMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85, 
        metalness: 0.1,
        bumpMap: rockBump,
        bumpScale: 0.25 
    });

    const pos = islandGeo.attributes.position;
    const colors = [];

    // ==========================================
    // 3. THUẬT TOÁN ĐỊA HÌNH VÀ PHỐI MÀU (CHUẨN TỈ LỆ VÀNG)
    // ==========================================
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const distance = Math.sqrt(x*x + y*y);
        const angle = Math.atan2(y, x);

        let elevation = 0;

        if (distance < 90) {
            let baseDome = (1 - Math.pow(distance / 90, 1.5)) * 14; 
            let noise = simplex.noise2D(x * 0.015, y * 0.015) * 10 + simplex.noise2D(x * 0.05, y * 0.05) * 3;
            elevation = baseDome + noise;

            // Nặn đỉnh núi lửa ngầu lòi, gai góc
            if (distance < 45) { 
                let centerCone = Math.pow(1 - (distance / 45), 2) * 32; 
                let jagged = simplex.noise2D(x * 0.12, y * 0.12) * 4.0; // Tăng độ lởm chởm
                
                if (distance < 13) {
                    const craterMask = Math.cos((distance / 13) * Math.PI / 2);
                    centerCone -= 18 * craterMask;
                    jagged *= 0.1; 
                }
                elevation += centerCone + jagged; 
            }

            // Vuốt mượt bãi biển: Xóa sổ vực thẳm 90 độ
            let beachWeight = 0;
            if (angle > -0.2 && angle < 2.7) {
                let aWeight = 1.0;
                if (angle < 0.2) aWeight = (angle + 0.2) / 0.4; 
                else if (angle > 2.3) aWeight = (2.7 - angle) / 0.4; 
                
                let dWeight = 0;
                if (distance > 30) {
                    dWeight = Math.min(1.0, (distance - 30) / 15.0); 
                }
                beachWeight = aWeight * dWeight;
            }

            if (beachWeight > 0) {
                let beachElevation = 5.0 + simplex.noise2D(x*0.02, y*0.02) * 1.5;
                if (elevation > beachElevation) {
                    elevation = elevation * (1 - beachWeight) + beachElevation * beachWeight;
                }
            }
        }

        // 2 Ngọn đồi phụ cho đảo đỡ trống
        let distSat1 = Math.sqrt((x - 65)**2 + (y + 50)**2); 
        if (distSat1 < 22) {
            let satEl = (1 - distSat1/22) * 8 + simplex.noise2D(x*0.05, y*0.05)*3;
            elevation = Math.max(elevation, satEl);
        }

        let distSat2 = Math.sqrt((x + 75)**2 + (y - 30)**2); 
        if (distSat2 < 18) {
            let satEl = (1 - distSat2/18) * 6 + simplex.noise2D(x*0.06, y*0.06)*2;
            elevation = Math.max(elevation, satEl);
        }
        
        elevation = Math.max(0, elevation);
        pos.setZ(i, elevation);

        // BẢNG MÀU CHUYỂN GIAO MƯỢT MÀ (KHÔNG XANH Ở CHÂN NÚI LỬA)
        const color = new THREE.Color();

        if (elevation <= 5.5) {
            color.setHex(0xf5e6c1); // Cát biển vàng ươm
        } else if (elevation > 5.5 && elevation < 8.5) {
            // Chuyển từ cát sang đất khô cằn (vùng đệm)
            const t = (elevation - 5.5) / (8.5 - 5.5);
            color.setHex(0xf5e6c1).lerp(new THREE.Color(0xa19366), t); 
        } else if (elevation >= 8.5 && elevation < 12.5) {
            // Chuyển từ đất khô sang đá xám
            const t = (elevation - 8.5) / (12.5 - 8.5);
            color.setHex(0xa19366).lerp(new THREE.Color(0x7c7c7c), t); 
        } else if (elevation >= 12.5 && elevation < 17) {
            // Chuyển từ đá xám sang đá Bazan đen sẫm
            const t = (elevation - 12.5) / (17 - 12.5);
            color.setHex(0x7c7c7c).lerp(new THREE.Color(0x2b2826), t); 
        } else if (elevation >= 17 && distance < 14) {
            // Xung quanh lõi miệng núi lửa (cháy xém)
            color.setHex(0x1a1817); 
        } else {
            // Đỉnh các mỏm đá nhô cao
            color.setHex(0x4a4542); 
        }
        
        colors.push(color.r, color.g, color.b);
    }

    islandGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    islandGeo.computeVertexNormals();

    const island = new THREE.Mesh(islandGeo, islandMat);
    island.rotation.x = -Math.PI / 2;
    island.castShadow = true;
    island.receiveShadow = true;
    scene.add(island);

    // ==========================================
    // 4. LẮP RÁP MIỆNG NÚI LỬA (NÂNG CAO TỌA ĐỘ Y LÊN 23)
    // ==========================================
    const craterGeo = new THREE.CircleGeometry(10.5, 32);
    const craterMat = new THREE.MeshStandardMaterial({ 
        map: lavaTex, 
        emissive: 0xff1100,      // Đỏ cam nguyên thủy
        emissiveMap: lavaTex,    
        emissiveIntensity: 8.0,  // Cường độ chói lóa
        roughness: 0.1          
    });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.rotation.x = -Math.PI / 2;
    
    // 🔥 ĐIỂM CHỐT HẠ: ÉP DUNG NHAM NỔI LÊN MẶT ĐÁ
    crater.position.y = 23.0; 
    scene.add(crater);

    // ==========================================
    // 5. THÊM QUẦNG SÁNG TỎA NHIỆT (FAKE GLOW BLOOM)
    // ==========================================
    const glowGeo = new THREE.CircleGeometry(11.5, 36);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff4400, 
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending 
    });
    const craterGlow = new THREE.Mesh(glowGeo, glowMat);
    craterGlow.rotation.x = -Math.PI / 2;
    
    // 🔥 QUẦNG SÁNG BAY LƠ LỬNG TRÊN MẶT DUNG NHAM 0.3 ĐƠN VỊ
    craterGlow.position.y = 23.3; 
    scene.add(craterGlow);

    return { island, pos };
}
