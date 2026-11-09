export type ImageSize = { width: number; height: number }
export type CropRect = ImageSize & { x: number; y: number }

// 选框使用显示坐标，导出始终使用变换后原图的像素坐标。
export function 缩放裁剪区域(rect: CropRect, source: ImageSize, target: ImageSize): CropRect {
  const scaleX = target.width / source.width
  const scaleY = target.height / source.height
  return {
    x: rect.x * scaleX,
    y: rect.y * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  }
}

export function 获取像素裁剪区域(rect: CropRect, size: ImageSize): CropRect {
  const x = Math.max(0, Math.min(Math.round(rect.x), size.width - 1))
  const y = Math.max(0, Math.min(Math.round(rect.y), size.height - 1))
  return {
    x,
    y,
    width: Math.max(1, Math.min(Math.round(rect.width), size.width - x)),
    height: Math.max(1, Math.min(Math.round(rect.height), size.height - y)),
  }
}
