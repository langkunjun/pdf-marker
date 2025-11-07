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


