import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export function spawnEcosystem(scene, pos) {
    function createJungleTree() {
        // A. THÂN CÂY
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 4, 5);
        trunkGeo.translate(0, 2, 0);
        
        // B. TÁN LÁ PHỨC HỢP
        const leafGeometries = [];
        
        const mainLeaves = new THREE.DodecahedronGeometry(2.0, 0);
        mainLeaves.translate(0, 4.8, 0); 
        leafGeometries.push(mainLeaves);
        
        const numClusters = 4;
        for (let i = 0; i < numClusters; i++) {
            const size = 1.0 + Math.random() * 0.8; 
            const subLeaves = new THREE.DodecahedronGeometry(size, 0);
            
            const angle = (i / numClusters) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 1.5 + Math.random() * 0.4;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = 3.5 + Math.random() * 1.5; 
            subLeaves.rotateX(Math.random() * Math.PI);
            subLeaves.rotateY(Math.random() * Math.PI);
            subLeaves.translate(x, y, z);
            
            leafGeometries.push(subLeaves);
        }
        
        const leavesGeo = BufferGeometryUtils.mergeGeometries(leafGeometries);
        
        return { trunkGeo, leavesGeo };
    }
    
    const bushGeo = new THREE.DodecahedronGeometry(1.4, 0);
    bushGeo.translate(0, 0.7, 0);

    const jungleTreesCount = 350; 
    const bushesCount = 500;      

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9, flatShading: true });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x247a1b, roughness: 0.8, flatShading: true });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x55aa22, roughness: 0.8, flatShading: true });

    const jGeos = createJungleTree();
    const instJTrunks = new THREE.InstancedMesh(jGeos.trunkGeo, woodMat, jungleTreesCount);
    const instJLeaves = new THREE.InstancedMesh(jGeos.leavesGeo, leavesMat, jungleTreesCount);
    const instBushes = new THREE.InstancedMesh(bushGeo, bushMat, bushesCount);

    instJTrunks.castShadow = instJTrunks.receiveShadow = true;
    instJLeaves.castShadow = instJLeaves.receiveShadow = true;
    instBushes.castShadow = instBushes.receiveShadow = true;

    // KHỞI TẠO BIẾN DUMMY DUY NHẤT CHO TOÀN BỘ HỆ SINH THÁI
    const dummy = new THREE.Object3D();
    
    let jTreeCount = 0; let bushCount = 0;

    for (let i = 0; i < pos.count; i += 3) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const distance = Math.sqrt(x*x + y*y);
        const angle = Math.atan2(y, x);
        const isBeachZone = (angle > 0 && angle < 2.5) && distance > 30;

        if (!isBeachZone && z > 5.5 && z < 14 && distance > 18) {
            const rand = Math.random();
            if (rand < 0.1 && jTreeCount < jungleTreesCount) {
                dummy.position.set(x, z, -y);
                dummy.rotation.set(0, Math.random() * Math.PI, 0);
                const s = 0.7 + Math.random() * 0.6;
                dummy.scale.set(s, s + Math.random()*0.5, s);
                dummy.updateMatrix();
                instJTrunks.setMatrixAt(jTreeCount, dummy.matrix);
                instJLeaves.setMatrixAt(jTreeCount, dummy.matrix);
                jTreeCount++;
            }
            if (rand > 0.1 && rand < 0.25 && bushCount < bushesCount) {
                dummy.position.set(x, z, -y);
                dummy.rotation.set(Math.random()*0.2, Math.random() * Math.PI, Math.random()*0.2);
                const s = 0.5 + Math.random() * 0.9;
                dummy.scale.set(s, s*0.6, s);
                dummy.updateMatrix();
                instBushes.setMatrixAt(bushCount, dummy.matrix);
                bushCount++;
            }
        }
    }
    scene.add(instJTrunks); scene.add(instJLeaves); scene.add(instBushes);

    const loader = new GLTFLoader();
    loader.load('coconut_tree_low_poly.glb', function (gltf) {
        const treeModel = gltf.scene;
        treeModel.traverse((child) => {
            if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
        });

        const baseScale = 0.05; 
        const totalCoconuts = 200; 
        let cocoCount = 0;
        
        for (let i = 0; i < pos.count && cocoCount < totalCoconuts; i += 5) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i); 
            const distance = Math.sqrt(x*x + y*y);
            const angle = Math.atan2(y, x);

            if (z > 5.2 && z < 9 && distance > 14) { 
                let prob = 0.02; 
                if (angle > 0 && angle < 2.5) prob *= 15.0; 

                if (Math.random() < prob) {
                    const newTree = treeModel.clone();
                    newTree.position.set(x, z, -y); 
                    newTree.rotation.y = Math.random() * Math.PI * 2;
                    const s = baseScale + Math.random() * 0.02; 
                    newTree.scale.set(s, s, s);
                    scene.add(newTree);
                    cocoCount++;
                }
            }
        }
    });

    const textureLoader = new THREE.TextureLoader();

    const rockColorMap = textureLoader.load('./textures/rock_albedo.jpg');
    const rockNormalMap = textureLoader.load('./textures/rock_normal.jpg');
    const rockRoughnessMap = textureLoader.load('./textures/rock_roughness.jpg');

    rockColorMap.wrapS = rockColorMap.wrapT = THREE.RepeatWrapping;
    rockNormalMap.wrapS = rockNormalMap.wrapT = THREE.RepeatWrapping;
    rockRoughnessMap.wrapS = rockRoughnessMap.wrapT = THREE.RepeatWrapping;
    
    rockColorMap.repeat.set(2, 2);
    rockNormalMap.repeat.set(2, 2);
    rockRoughnessMap.repeat.set(2, 2);

    const rockGeo = new THREE.DodecahedronGeometry(1.2, 1);
    
    const rockMat = new THREE.MeshStandardMaterial({ 
        map: rockColorMap,
        normalMap: rockNormalMap,
        roughnessMap: rockRoughnessMap,
        roughness: 0.9, 
    });

    const instRocks = new THREE.InstancedMesh(rockGeo, rockMat, 400); 
    instRocks.castShadow = true; 
    instRocks.receiveShadow = true;

    let rockCount = 0;
    
    // ĐÃ XÓA KHAI BÁO const dummy = new THREE.Object3D(); Ở ĐÂY
    // Ta tái sử dụng biến dummy ở trên để tính toán ma trận cho đá
    for (let i = 0; i < pos.count && rockCount < 400; i += 2) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        
        if ((z > 4.5 && z < 6) || (z > 12 && z < 18)) {
            if (Math.random() < 0.08) {
                dummy.position.set(x, z - 0.2, -y);
                dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
                const s = 0.5 + Math.random() * 1.5;
                dummy.scale.set(s * 1.5, s, s * 1.2);
                
                // Cập nhật ma trận và gán cho đá
                dummy.updateMatrix();
                instRocks.setMatrixAt(rockCount, dummy.matrix);
                rockCount++;
            }
        }
    }
    scene.add(instRocks);
}