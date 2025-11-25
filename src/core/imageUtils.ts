// 图片适配与加载工具：用于将图片按等比方式放入标注区域内
export interface FittedSize {
  width: number;
  height: number;
}
// 等比缩放，使图片完整“包含”在容器内，不裁剪且不溢出
export function fitImageContain(imgWidth: number, imgHeight: number, containerWidth: number, containerHeight: number): FittedSize {
  if (imgWidth <= 0 || imgHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return { width: 0, height: 0 };
  }
  const imgRatio = imgWidth / imgHeight;
  const containerRatio = containerWidth / containerHeight;
  if (imgRatio > containerRatio) {
    // 图片相对更“宽”，以容器宽为基准，按比例压缩高度
    const width = containerWidth;
    const height = Math.round(width / imgRatio);
    return { width, height };
  } else {
    // 图片相对更“高”，以容器高为基准，按比例压缩宽度
    const height = containerHeight;
    const width = Math.round(height * imgRatio);
    return { width, height };
  }
}

export function loadImage(src: string): Promise<{ width: number; height: number }>
{
  return new Promise((resolve, reject) => {
    const img = new Image();
    // 读取图片的自然尺寸，用于后续等比缩放计算
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// 处理 PNG 图片，移除白色背景，保留透明通道
export function processPngRemoveBackground(imageSrc: string, threshold: number = 240): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        
        // 绘制图片
        ctx.drawImage(img, 0, 0);
        
        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 移除白色背景（将接近白色的像素设为透明）
        // 阈值：如果 RGB 都接近 255，则认为是白色背景
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // 如果像素接近白色，将 alpha 设为 0（透明）
          if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0; // 设置 alpha 为 0（完全透明）
          }
        }
        
        // 将处理后的数据写回 canvas
        ctx.putImageData(imageData, 0, 0);
        
        // 将 canvas 转换为 PNG blob，然后转换为 Uint8Array
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('无法生成 blob'));
            return;
          }
          
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);
            resolve(uint8Array);
          };
          reader.onerror = () => reject(new Error('读取 blob 失败'));
          reader.readAsArrayBuffer(blob);
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageSrc;
  });
}