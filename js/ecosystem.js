import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// 1. HÀM TẠO HÌNH KHỐI
function createJungleTreeGeometry() {
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 4, 5);
    trunkGeo.translate(0, 2, 0);
    
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
        subLeaves.rotateX(Math.random() * Math.PI);
        subLeaves.rotateY(Math.random() * Math.PI);
        subLeaves.translate(Math.cos(angle) * radius, 3.5 + Math.random() * 1.5, Math.sin(angle) * radius);
        
        leafGeometries.push(subLeaves);
    }
    
    return { 
        trunkGeo, 
        leavesGeo: BufferGeometryUtils.mergeGeometries(leafGeometries) 
    };
}

// 2. HÀM KHỞI TẠO INSTANCED MESH
function initFloraInstances(treesCount, bushesCount) {
    const { trunkGeo, leavesGeo } = createJungleTreeGeometry();
    
    const bushGeo = new THREE.DodecahedronGeometry(1.4, 0);
    bushGeo.translate(0, 0.7, 0);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9, flatShading: true });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true });

    const trunks = new THREE.InstancedMesh(trunkGeo, woodMat, treesCount);
    const leaves = new THREE.InstancedMesh(leavesGeo, leavesMat, treesCount);
    const bushes = new THREE.InstancedMesh(bushGeo, bushMat, bushesCount);

    [trunks, leaves, bushes].forEach(mesh => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    });

    return { trunks, leaves, bushes };
}

export function spawnEcosystem(scene, pos) {
    const jungleTreesCount = 350; 
    const bushesCount = 500;      
    
    const instances = initFloraInstances(jungleTreesCount, bushesCount);
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();
    
    let jTreeIdx = 0; 
    let bushIdx = 0;

    for (let i = 0; i < pos.count; i += 3) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const distance = Math.sqrt(x*x + y*y);
        const angle = Math.atan2(y, x);
        const isBeachZone = (angle > 0 && angle < 2.5) && distance > 30;

        // Bỏ qua các khu vực không phù hợp (biển, miệng núi lửa)
        if (isBeachZone || z <= 5.5 || z >= 14 || distance <= 18) continue;

        const rand = Math.random();
        
        // --- Sinh Cây rừng ---
        if (rand < 0.1 && jTreeIdx < jungleTreesCount) {
            dummy.position.set(x, z, -y);
            dummy.rotation.set(0, Math.random() * Math.PI, 0);
            const s = 0.7 + Math.random() * 0.6;
            dummy.scale.set(s, s + Math.random() * 0.5, s);
            dummy.updateMatrix();
            
            instances.trunks.setMatrixAt(jTreeIdx, dummy.matrix);
            instances.leaves.setMatrixAt(jTreeIdx, dummy.matrix);

            // Tô màu lá cây rừng
            tempColor.setHex(0x247a1b).offsetHSL((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
            instances.leaves.setColorAt(jTreeIdx, tempColor);
            
            jTreeIdx++;
        }
        
        // --- Sinh Bụi rậm ---
        if (rand > 0.1 && rand < 0.25 && bushIdx < bushesCount) {
            dummy.position.set(x, z, -y);
            dummy.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2);
            const s = 0.5 + Math.random() * 0.9;
            dummy.scale.set(s, s * 0.6, s);
            dummy.updateMatrix();
            
            instances.bushes.setMatrixAt(bushIdx, dummy.matrix);

            // Coloring
            if (Math.random() < 0.10) {
                const flowerColors = [0xff6b81, 0xffa502, 0xff4757];
                tempColor.setHex(flowerColors[Math.floor(Math.random() * flowerColors.length)]);
            } else {
                tempColor.setHex(0x55aa22).offsetHSL((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
            }
            instances.bushes.setColorAt(bushIdx, tempColor);

            bushIdx++;
        }
    }

    if (instances.leaves.instanceColor) instances.leaves.instanceColor.needsUpdate = true;
    if (instances.bushes.instanceColor) instances.bushes.instanceColor.needsUpdate = true;

    scene.add(instances.trunks); 
    scene.add(instances.leaves); 
    scene.add(instances.bushes);

    //Palm Trees
    const loader = new GLTFLoader();
    
    const treeFiles = [
        './glb/Palm_tree_1.glb', 
        './glb/Palm_tree_2.glb', 
        './glb/Palm_tree_3.glb', 
        './glb/Palm_tree_4.glb'
    ];

    const baseScales = [0.05, 2.5, 2.5, 1]; 

    Promise.all(treeFiles.map(file => loader.loadAsync(file)))
        .then((gltfResults) => {
            
            const palmModels = gltfResults.map(gltf => {
                const model = gltf.scene;
                model.traverse((child) => {
                    if (child.isMesh) { 
                        child.castShadow = true; 
                        child.receiveShadow = true; 
                    }
                });
                return model;
            });

            const totalCoconuts = 80; 
            let cocoCount = 0;
            
            for (let i = 0; i < pos.count && cocoCount < totalCoconuts; i += 5) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const z = pos.getZ(i); 
                const distance = Math.sqrt(x*x + y*y);
                const angle = Math.atan2(y, x);

                if (z > 5.2 && z < 9 && distance > 14) { 
                    let prob = 0.005; 
                    if (angle > 0 && angle < 2.5) prob *= 10.0; 

                    if (Math.random() < prob) {
                        const randomIndex = Math.floor(Math.random() * palmModels.length);
                        const newTree = palmModels[randomIndex].clone();
                        
                        newTree.position.set(x, z, -y); 
                        newTree.rotation.y = Math.random() * Math.PI * 2;
                        
                        const specificBaseScale = baseScales[randomIndex];
                        
                        const s = specificBaseScale + Math.random() * (specificBaseScale * 0.2); 
                        newTree.scale.set(s, s, s);
                        
                        scene.add(newTree);
                        cocoCount++;
                    }
                }
            }
        })
        .catch((error) => {
            console.error("Lỗi tải mô hình cây dừa:", error);
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

                dummy.updateMatrix();
                instRocks.setMatrixAt(rockCount, dummy.matrix);
                rockCount++;
            }
        }
    }
    scene.add(instRocks);
}
