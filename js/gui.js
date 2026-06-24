import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

export function initGUI(water, sunLight, sunMat, hull) {
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
}
