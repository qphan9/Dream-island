import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

// Thay đổi tham số truyền vào: Nhận thêm hàm toggleTime từ module lighting
export function initGUI(water, toggleTime) {
    const gui = new GUI({ title: 'God Mode - Điều Khiển Thế Giới' });

    const params = {
        waterLevel: 5,           
        waterColor: '#006b8f',    
        toggleDayNight: () => {
            if (toggleTime) toggleTime();
        }
    };

    // ==========================================
    // 1. NHÓM ĐẠI DƯƠNG
    // ==========================================
    const waterFolder = gui.addFolder('Đại Dương');
    
    waterFolder.add(params, 'waterLevel', 0, 20, 0.1).name('Độ cao mực nước').onChange((value) => {
        if (water) water.position.y = value;
    });

    waterFolder.addColor(params, 'waterColor').name('Màu nước biển').onChange((value) => {
        if (water) water.material.uniforms['waterColor'].value.set(value);
    });

    // ==========================================
    // 2. NHÓM THỜI GIAN
    // ==========================================
    const timeFolder = gui.addFolder('Scene');
    
    // Tạo nút bấm chuyển cảnh
    timeFolder.add(params, 'toggleDayNight').name('Chuyển Ngày / Đêm');
}
