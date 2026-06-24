import * as THREE from 'three';

export function createTerrain(scene) {
    // SimplexNoise được khai báo toàn cục từ thư viện CDN ở index.html
    const simplex = new SimplexNoise();
    const islandSize = 240; 
    const segments = 300; 

    const islandGeo = new THREE.PlaneGeometry(islandSize, islandSize, segments, segments);
    const islandMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9, 
        metalness: 0.05
    });

    const pos = islandGeo.attributes.position;
    const colors = [];

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

            let isBeachZone = (angle > 0 && angle < 2.5);
            if (isBeachZone && distance > 30) {
                elevation = Math.min(elevation, 6.2 + simplex.noise2D(x*0.02, y*0.02) * 1.5);
            }

            if (distance < 38) {
                let centerCone = (1 - (distance / 38)) * 30;
                if (distance < 13) {
                    const craterMask = Math.cos((distance / 13) * Math.PI / 2);
                    centerCone -= 18 * craterMask;
                }
                elevation += centerCone; 
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

        const color = new THREE.Color();
        let isBeachZone = (angle > 0 && angle < 2.5);

        if (isBeachZone && distance > 30 && distance < 90) {
            if (elevation <= 5.3) color.setHex(0xe8dcb9); 
            else color.setHex(0xfff5d1); 
        } else {
            if (elevation <= 5.3) {
                color.setHex(0xe8dcb9); 
            } else if (elevation > 5.3 && elevation < 11) {
                const t = (elevation - 5.3) / (11 - 5.3);
                color.setHex(0xe8dcb9).lerp(new THREE.Color(0x4ca324), t); 
            } else if (elevation >= 11 && elevation < 17) {
                const t = (elevation - 11) / (17 - 11);
                color.setHex(0x4ca324).lerp(new THREE.Color(0x4a4744), t); 
            } else if (elevation >= 17 && distance < 12) {
                color.setHex(0xff2a00); 
            } else {
                color.setHex(0x2b2826); 
            }
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

    const craterGeo = new THREE.CircleGeometry(10, 24);
    const craterMat = new THREE.MeshStandardMaterial({ color: 0xff1100, roughness: 1.0, transparent: true, opacity: 0.95 });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.rotation.x = -Math.PI / 2;
    crater.position.y = 20.5; 
    scene.add(crater);

    return { island, pos };
}
