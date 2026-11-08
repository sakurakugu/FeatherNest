import assert from 'node:assert/strict'
import { test } from 'node:test'
import { 获取像素裁剪区域, 缩放裁剪区域 } from '../src/modules/工具/src/lib/crop-geometry.ts'

test('缩小的桌面预览按原图尺寸还原裁剪坐标', () => {
  assert.deepEqual(
    缩放裁剪区域(
      { x: 100, y: 50, width: 400, height: 300 },
      { width: 800, height: 600 },
      { width: 4000, height: 3000 },
    ),
    { x: 500, y: 250, width: 2000, height: 1500 },
  )
})

test('预览尺寸变化后原图选区保持不变', () => {
  const size = { width: 4032, height: 3024 }
  const crop = { x: 384, y: 192, width: 2016, height: 1512 }
  for (const frame of [{ width: 768, height: 576 }, { width: 320, height: 240 }]) {
    const displayed = 缩放裁剪区域(crop, size, frame)
    const restored = 缩放裁剪区域(displayed, frame, size)
    for (const key of Object.keys(crop)) {
      assert.ok(Math.abs(restored[key] - crop[key]) < 1e-8)
    }
  }
})

test('旋转后使用交换宽高的坐标空间', () => {
  assert.deepEqual(
    缩放裁剪区域(
      { x: 30, y: 40, width: 120, height: 200 },
      { width: 300, height: 400 },
      { width: 3000, height: 4000 },
    ),
    { x: 300, y: 400, width: 1200, height: 2000 },
  )
})

test('整图选区始终导出完整像素范围', () => {
  const size = { width: 101, height: 57 }
  assert.deepEqual(获取像素裁剪区域({ x: 0, y: 0, ...size }, size), { x: 0, y: 0, ...size })
})

test('右下角的浮点选区取整后不会越界', () => {
  assert.deepEqual(
    获取像素裁剪区域(
      { x: 60.5, y: 20.5, width: 40.5, height: 36.5 },
      { width: 101, height: 57 },
    ),
    { x: 61, y: 21, width: 40, height: 36 },
  )
})

test('极小图片和亚像素选区至少保留一个像素', () => {
  assert.deepEqual(
    获取像素裁剪区域(
      { x: 0.9, y: 0.9, width: 0.1, height: 0.1 },
      { width: 1, height: 1 },
    ),
    { x: 0, y: 0, width: 1, height: 1 },
  )
})

test('浮点误差造成的负坐标不会传给导出服务', () => {
  assert.deepEqual(
    获取像素裁剪区域(
      { x: -1e-10, y: -1e-10, width: 100.000000001, height: 100.000000001 },
      { width: 100, height: 100 },
    ),
    { x: 0, y: 0, width: 100, height: 100 },
  )
})
