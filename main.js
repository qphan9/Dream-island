import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// IMPORT THƯ VIỆN BẢNG ĐIỀU KHIỂN (GUI) TỪ CDN
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

// ==========================================
// 1. KHỞI TẠO KHÔNG GIAN
// ==========================================
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xfffaf0, 0.0025); 

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.set(0, 80, 160);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.toneMapping = THREE.ACESFilmicToneMapping; 
renderer.toneMappingExposure = 0.95; 
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.47; 

// ==========================================
// 2. TẠO TEXTURE BẰNG CODE (PROCEDURAL TEXTURES)
// ==========================================
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

// ==========================================
// 3. HỆ THỐNG ÁNH SÁNG & TẠO HÌNH MẶT TRỜI
// ==========================================
const ambientLight = new THREE.HemisphereLight(0xfff3d4, 0x404040, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4); 
sunLight.position.set(120, 100, -80); // Đẩy mặt trời ra phía sau đảo một chút
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
const d = 140;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

// VẼ MẶT TRỜI THẬT (Quả cầu phát sáng)
const sunGeo = new THREE.SphereGeometry(10, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.copy(sunLight.position);

// Tạo quầng sáng (Glow) quanh mặt trời
const glowGeo = new THREE.SphereGeometry(18, 32, 32);
const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0xffcc77, 
    transparent: true, 
    opacity: 0.4, 
    blending: THREE.AdditiveBlending 
});
const glowMesh = new THREE.Mesh(glowGeo, glowMat);
sunMesh.add(glowMesh);
scene.add(sunMesh);

// ==========================================
// 4. MẶT NƯỚC BIỂN
// ==========================================
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

// ==========================================
// 5. THUẬT TOÁN ĐỊA HÌNH
// ==========================================
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

// ==========================================
// 6. RẢI HỆ SINH THÁI
// ==========================================
function createJungleTree() {
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 4, 5);
    trunkGeo.translate(0, 2, 0);
    const leavesGeo = new THREE.DodecahedronGeometry(2.8, 0);
    leavesGeo.translate(0, 4.5, 0);
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

const rockGeo = new THREE.DodecahedronGeometry(1.2, 1);
const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9, flatShading: true });
const instRocks = new THREE.InstancedMesh(rockGeo, rockMat, 400); 
instRocks.castShadow = true; instRocks.receiveShadow = true;

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

// ==========================================
// 7. GÁN TEXTURE CHO CẦU CẢNG & THUYỀN
// ==========================================
const dockGroup = new THREE.Group();
const dockGeo = new THREE.BoxGeometry(4, 0.5, 16);
// Sử dụng vân gỗ sinh bằng code (woodTexture) ở đây
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
// Thuyền cũng được ốp vân gỗ cực xịn
const hullMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.8 });
const hull = new THREE.Mesh(hullGeo, hullMat);
hull.position.y = 5; 
hull.castShadow = true;
boatGroup.add(hull);
boatGroup.position.set(35, 0, 50);
boatGroup.rotation.y = Math.PI / 4;
scene.add(boatGroup);

// ==========================================
// 8. BẢNG ĐIỀU KHIỂN UI (LIL-GUI)
// ==========================================
// Khởi tạo bảng lệnh ở góc màn hình
const gui = new GUI({ title: 'God Mode - Điều Khiển Thế Giới' });

const params = {
    waterLevel: 5,           // Mực nước mặc định
    sunIntensity: 1.4,       // Độ sáng mặc định
    sunColor: '#fffaed',     // Màu nắng
    waterColor: '#006b8f'    // Màu nước
};

// Thanh trượt mực nước: Lên sẽ làm lụt đảo, xuống sẽ khô cạn
gui.add(params, 'waterLevel', 0, 20, 0.1).name('Độ cao mực nước').onChange((value) => {
    water.position.y = value;
    hull.position.y = value; // Thuyền nổi theo mặt nước
});

// Thanh trượt độ sáng mặt trời
gui.add(params, 'sunIntensity', 0, 5, 0.1).name('Độ sáng Mặt Trời').onChange((value) => {
    sunLight.intensity = value;
});

// Bộ chọn màu nắng (chỉnh được cả bầu trời xế chiều hay trưa nắng gắt)
gui.addColor(params, 'sunColor').name('Màu ánh nắng').onChange((value) => {
    sunLight.color.set(value);
    sunMat.color.set(value);
});

// Bộ chọn màu nước biển
gui.addColor(params, 'waterColor').name('Màu nước biển').onChange((value) => {
    water.material.uniforms['waterColor'].value.set(value);
});

// ==========================================
// 9. MÂY BÔNG, ĐOM ĐÓM & TÀN LỬA
// ==========================================
const cloudGroup = new THREE.Group();
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true, transparent: true, opacity: 0.9 });
for (let i = 0; i < 8; i++) { 
    const singleCloud = new THREE.Group();
    const numPuffs = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numPuffs; j++) {
        const puffGeo = new THREE.SphereGeometry(2.5 + Math.random() * 4, 8, 8);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(j * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        singleCloud.add(puff);
    }
    singleCloud.position.set((Math.random() - 0.5) * 190, 45 + Math.random() * 15, (Math.random() - 0.5) * 190);
    cloudGroup.add(singleCloud);
}
scene.add(cloudGroup);

const particleGeo = new THREE.BufferGeometry();
const particleCount = 180;
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 160;
    particlePositions[i + 1] = 5 + Math.random() * 30;
    particlePositions[i + 2] = (Math.random() - 0.5) * 160;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMat = new THREE.PointsMaterial({ color: 0xffe699, size: 0.4, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

const lavaCount = 120;
const lavaGeo = new THREE.BufferGeometry();
const lavaPositions = new Float32Array(lavaCount * 3);
const lavaSpeeds = [];

for (let i = 0; i < lavaCount; i++) {
    lavaPositions[i * 3] = (Math.random() - 0.5) * 4;
    lavaPositions[i * 3 + 1] = 20.5 + Math.random() * 2; 
    lavaPositions[i * 3 + 2] = (Math.random() - 0.5) * 4;

    lavaSpeeds.push({
        x: (Math.random() - 0.5) * 0.25,
        y: 0.35 + Math.random() * 0.4, 
        z: (Math.random() - 0.5) * 0.25
    });
}
lavaGeo.setAttribute('position', new THREE.BufferAttribute(lavaPositions, 3));
const lavaMat = new THREE.PointsMaterial({ color: 0xff4500, size: 1.3, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
const lavaParticles = new THREE.Points(lavaGeo, lavaMat);
scene.add(lavaParticles);

// ==========================================
// 10. RENDER LOOP
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    water.material.uniforms['time'].value += 1.0 / 60.0;
    
    // Thuyền dập dềnh bám theo mực nước hiện tại được set trong GUI
    boatGroup.position.y = Math.sin(time * 2) * 0.2; 
    boatGroup.rotation.z = Math.cos(time * 1.5) * 0.05;

    cloudGroup.children.forEach((cloud, index) => {
        cloud.position.x += 0.015 * (index % 2 === 0 ? 1 : -1);
        if (cloud.position.x > 150) cloud.position.x = -150;
        if (cloud.position.x < -150) cloud.position.x = 150;
    });

    particles.rotation.y = time * 0.015;

    const lavaPosArr = lavaParticles.geometry.attributes.position.array;
    for (let i = 0; i < lavaCount; i++) {
        lavaPosArr[i * 3] += lavaSpeeds[i].x;     
        lavaPosArr[i * 3 + 1] += lavaSpeeds[i].y; 
        lavaPosArr[i * 3 + 2] += lavaSpeeds[i].z; 
        lavaSpeeds[i].y -= 0.012; 

        if (lavaPosArr[i * 3 + 1] < 19 || lavaPosArr[i * 3 + 1] > 65) {
            lavaPosArr[i * 3] = (Math.random() - 0.5) * 4;
            lavaPosArr[i * 3 + 1] = 20.5; 
            lavaPosArr[i * 3 + 2] = (Math.random() - 0.5) * 4;
            lavaSpeeds[i].y = 0.35 + Math.random() * 0.4; 
        }
    }
    lavaParticles.geometry.attributes.position.needsUpdate = true;

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});