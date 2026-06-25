import * as THREE from 'three';

export function createTerrain(scene) {
    const simplex = new SimplexNoise();
    const islandSize = 240; 
    const segments = 300; 

    // ==========================================
    // 1. TẠO BUMP MAP (SẦN SÙI) MỊN HƠN
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
    // 2. TEXTURE DUNG NHAM GLOW RỰC RỠ TỪ TÂM
    // ==========================================
    function createLavaTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, '#ffffff'); 
        grad.addColorStop(0.2, '#ffea00'); 
        grad.addColorStop(0.6, '#ff3300'); 
        grad.addColorStop(1, '#8b0000'); 
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        
        for(let i = 0; i < 4000; i++) {
            ctx.fillStyle = Math.random() > 0.6 ? '#ffcc00' : '#1a0500'; 
            const size = Math.random() * 4 + 1;
            ctx.fillRect(Math.random()*512, Math.random()*512, size, size);
        }
        return new THREE.CanvasTexture(canvas);
    }

    const rockBump = createRockBumpMap();
    const lavaTex = createLavaTexture();

    const islandGeo = new THREE.PlaneGeometry(islandSize, islandSize, segments, segments);
    
    const islandMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8, 
        metalness: 0.2,
        bumpMap: rockBump,
        bumpScale: 0.2 
    });

    const pos = islandGeo.attributes.position;
    const colors = [];

    // ==========================================
    // 3. THUẬT TOÁN ĐỊA HÌNH VÀ PHỐI MÀU (ĐÃ FIX SMOOTH)
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

            // NẶN NÚI LỬA (Dốc thoai thoải hơn để nối vào bãi cát)
            if (distance < 45) { 
                let centerCone = Math.pow(1 - (distance / 45), 2) * 32; 
                let jagged = simplex.noise2D(x * 0.12, y * 0.12) * 3.5; 
                
                if (distance < 13) {
                    const craterMask = Math.cos((distance / 13) * Math.PI / 2);
                    centerCone -= 18 * craterMask;
                    jagged *= 0.1; 
                }
                elevation += centerCone + jagged; 
            }

            // [VIP] THUẬT TOÁN VUỐT MƯỢT BÃI BIỂN (Thay cho lệnh cắt 90 độ cũ)
            let beachWeight = 0;
            if (angle > -0.2 && angle < 2.7) {
                // Làm mờ 2 mép viền bãi biển
                let aWeight = 1.0;
                if (angle < 0.2) aWeight = (angle + 0.2) / 0.4; 
                else if (angle > 2.3) aWeight = (2.7 - angle) / 0.4; 
                
                // Trộn độ cao dốc dần từ cự ly 30 đổ ra ngoài
                let dWeight = 0;
                if (distance > 30) {
                    dWeight = Math.min(1.0, (distance - 30) / 15.0); 
                }
                beachWeight = aWeight * dWeight;
            }

            if (beachWeight > 0) {
                let beachElevation = 5.0 + simplex.noise2D(x*0.02, y*0.02) * 1.5;
                if (elevation > beachElevation) {
                    // Ép độ cao dần dần xuống mặt cát
                    elevation = elevation * (1 - beachWeight) + beachElevation * beachWeight;
                }
            }
        }

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

        // BẢNG MÀU TỰ ĐỘNG THEO ĐỘ DỐC (Không cần cắt cứng bãi biển nữa)
        const color = new THREE.Color();

        if (elevation <= 5.5) {
            color.setHex(0xf5e6c1); // Cát vàng ươm rực rỡ
        } else if (elevation > 5.5 && elevation < 11) {
            const t = (elevation - 5.5) / (11 - 5.5);
            // Cát hòa vào cỏ xanh ngọc rực rỡ
            color.setHex(0xf5e6c1).lerp(new THREE.Color(0x6abf3b), t); 
        } else if (elevation >= 11 && elevation < 17) {
            const t = (elevation - 11) / (17 - 11);
            // Từ cỏ sang đá xám nhạt
            color.setHex(0x6abf3b).lerp(new THREE.Color(0x6b6661), t); 
        } else if (elevation >= 17 && distance < 14) {
            color.setHex(0x3a3633); // Đá quanh miệng núi lửa
        } else {
            color.setHex(0x4a4542); // Đỉnh đá xám
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
    // 4. LẮP RÁP MIỆNG NÚI LỬA SIÊU SÁNG
    // ==========================================
    const craterGeo = new THREE.CircleGeometry(10.5, 32);
    const craterMat = new THREE.MeshStandardMaterial({ 
        map: lavaTex, 
        emissive: 0xffffff,      
        emissiveMap: lavaTex,    
        emissiveIntensity: 3,  
        roughness: 4          
    });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.rotation.x = -Math.PI / 2;
    crater.position.y = 23; 
    scene.add(crater);

    // ==========================================
    // 5. THÊM QUẦNG SÁNG ẢO (FAKE GLOW BLOOM)
    // ==========================================
    const glowGeo = new THREE.CircleGeometry(11.5, 36);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff8800, 
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending 
    });
    const craterGlow = new THREE.Mesh(glowGeo, glowMat);
    craterGlow.rotation.x = -Math.PI / 2;
    craterGlow.position.y = 23.3; 
    scene.add(craterGlow);

    return { island, pos };
}
