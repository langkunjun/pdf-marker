export const coordinate = {
    // 将 Canvas 坐标转为 PDF 坐标（如有缩放）
    toPdf(x: number, y: number, scale = 1) {
      return { x: x / scale, y: y / scale };
    },
  
    // 将 PDF 坐标转为 Canvas 坐标
    toCanvas(x: number, y: number, scale = 1) {
      return { x: x * scale, y: y * scale };
    },
  };
  