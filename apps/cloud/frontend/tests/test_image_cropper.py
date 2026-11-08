"""通过 Python Playwright 验证裁剪交互，不对页面样式做自动化断言。"""

from __future__ import annotations

import argparse
import base64
import struct
import zlib

from playwright.sync_api import Page, sync_playwright


def 创建测试图片(width: int, height: int) -> bytes:
    def chunk(name: bytes, data: bytes) -> bytes:
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data))

    rows = (b'\x00' + b'\xff\x00\x00\xff' * width) * height
    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(rows))
        + chunk(b'IEND', b'')
    )


def 获取选框(page: Page) -> dict:
    return page.locator('cropper-selection').evaluate(
        '(s) => ({x:s.x,y:s.y,width:s.width,height:s.height,ratio:s.aspectRatio})'
    )


def 等待绘制(page: Page) -> None:
    page.evaluate('() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')


def 拖动(page: Page, selector: str, dx: float, dy: float) -> None:
    target = page.locator(selector)
    target.scroll_into_view_if_needed()
    bounds = target.bounding_box()
    assert bounds is not None
    x, y = bounds['x'] + bounds['width'] / 2, bounds['y'] + bounds['height'] / 2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + dx, y + dy, steps=10)
    page.mouse.up()
    等待绘制(page)


def 触屏拖动(page: Page, selector: str, dx: float, dy: float) -> None:
    target = page.locator(selector)
    target.scroll_into_view_if_needed()
    bounds = target.bounding_box()
    assert bounds is not None
    x, y = bounds['x'] + bounds['width'] / 2, bounds['y'] + bounds['height'] / 2
    client = page.context.new_cdp_session(page)
    client.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
    for step in range(1, 11):
        client.send('Input.dispatchTouchEvent', {
            'type': 'touchMove',
            'touchPoints': [{'x': x + dx * step / 10, 'y': y + dy * step / 10}],
        })
    client.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    client.detach()
    等待绘制(page)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://localhost:5173')
    args = parser.parse_args()
    image = 创建测试图片(800, 600)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 1080}, accept_downloads=True)
        errors: list[str] = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'{args.url}/tests/cropper-harness.html')
        page.locator('input[type=file]').set_input_files(
            {'name': '测试图片.png', 'mimeType': 'image/png', 'buffer': image}
        )
        page.wait_for_function("document.querySelector('cropper-selection')?.width > 0")
        assert page.locator('.crop-selection__label').inner_text() == '800 × 600'

        拖动(page, 'cropper-handle[action="se-resize"]', -100, -80)
        cropped = 获取选框(page)
        assert cropped['width'] > 0 and cropped['height'] > 0
        assert cropped['width'] < 800 and cropped['height'] < 600
        拖动(page, 'cropper-handle[action="move"]', 20, 20)
        moved = 获取选框(page)
        assert moved['x'] > cropped['x'] and moved['y'] > cropped['y']

        for ratio in ['1:1', '4:3', '16:9', '3:4']:
            page.get_by_text(ratio, exact=True).click()
            等待绘制(page)
            target_ratio = int(ratio.split(':')[0]) / int(ratio.split(':')[1])
            rect = 获取选框(page)
            assert abs(rect['width'] / rect['height'] - target_ratio) < 1e-6, (ratio, rect)
            拖动(page, 'cropper-handle[action="se-resize"]', -30, -30)
            rect = 获取选框(page)
            assert abs(rect['width'] / rect['height'] - target_ratio) < 1e-6, (ratio, rect)

        label = page.locator('.crop-selection__label').inner_text()
        page.get_by_role('button', name='水平翻转', exact=True).click()
        page.get_by_role('slider').first.focus()
        page.keyboard.press('ArrowRight')
        等待绘制(page)
        assert page.locator('.crop-selection__label').inner_text() == label
        page.set_viewport_size({'width': 390, 'height': 844})
        等待绘制(page)
        assert page.locator('.crop-selection__label').inner_text() == label
        拖动(page, 'cropper-handle[action="move"]', 200, 200)
        page.locator('cropper-selection').evaluate('s => s.$moveTo(-100, -100)')
        rect = 获取选框(page)
        bounds = page.locator('cropper-canvas').bounding_box()
        assert bounds is not None
        assert rect['x'] >= -0.001 and rect['y'] >= -0.001
        assert rect['x'] + rect['width'] <= bounds['width'] + 0.001
        assert rect['y'] + rect['height'] <= bounds['height'] + 0.001

        page.get_by_role('button', name='右转 90°').click()
        等待绘制(page)
        rect = 获取选框(page)
        assert abs(rect['width'] / rect['height'] - 3 / 4) < 1e-6
        page.get_by_role('button', name='整张选中').click()
        等待绘制(page)
        assert page.get_by_role('radio', name='自由', exact=True).is_checked()
        assert page.locator('.crop-selection__label').inner_text() == '600 × 800'
        with page.expect_download() as downloaded:
            page.get_by_role('button', name='下载编辑结果', exact=True).click()
        png = downloaded.value.path().read_bytes()
        assert struct.unpack('>II', png[16:24]) == (600, 800)

        page.get_by_role('button', name='清空图片', exact=True).click()
        等待绘制(page)
        assert page.locator('cropper-canvas').is_hidden()
        page.locator('input[type=file]').set_input_files(
            {'name': '小图.png', 'mimeType': 'image/png', 'buffer': 创建测试图片(1, 1)}
        )
        page.wait_for_function("document.querySelector('.crop-selection__label')?.textContent === '1 × 1'")
        page.evaluate("""() => {
          const decode = HTMLImageElement.prototype.decode;
          let delayed = false;
          HTMLImageElement.prototype.decode = function() {
            const result = decode.call(this);
            if (delayed) return result;
            delayed = true;
            return result.then(() => new Promise(resolve => {window.释放延迟读取 = resolve;}));
          };
          window.恢复图片解码 = () => {HTMLImageElement.prototype.decode = decode;};
        }""")
        page.locator('input[type=file]').set_input_files(
            {'name': '延迟图片.png', 'mimeType': 'image/png', 'buffer': image}
        )
        page.wait_for_function("typeof window.释放延迟读取 === 'function'")
        page.locator('input[type=file]').set_input_files(
            {'name': '最新图片.png', 'mimeType': 'image/png', 'buffer': 创建测试图片(3, 2)}
        )
        page.wait_for_function("document.querySelector('.crop-selection__label')?.textContent === '3 × 2'")
        page.evaluate('() => {window.释放延迟读取();window.恢复图片解码();}')
        等待绘制(page)
        assert page.locator('.crop-selection__label').inner_text() == '3 × 2'
        page.evaluate('window.卸载测试组件()')
        assert page.locator('cropper-canvas').count() == 0

        preview = base64.b64encode(创建测试图片(160, 120)).decode()
        page.add_init_script(
            """(preview => {
              window.桌面导出请求 = null;
              window.已释放资源 = [];
              window.personalSystemDesktop = {
                runtime: 'electron',
                imageToolsGetCapabilities: async () => ({运行时:'desktop',支持后端增强:true}),
                imageToolsSelectInputs: async () => ['测试图片.png'],
                imageToolsSelectOutputPath: async () => '测试结果.png',
                imageToolsImportFromPaths: async () => [{
                  id:'测试资源',原始文件名:'测试图片.png',原始MimeType:'image/png',
                  宽度:1600,高度:1200,是否动画:false,预览地址:preview
                }],
                imageToolsConvert: async () => ({}),
                imageToolsEdit: async request => {
                  window.桌面导出请求 = request;
                  return {outputPath:'测试结果.png'};
                },
                imageToolsStitch: async () => ({}),
                imageToolsRelease: async ids => {window.已释放资源.push(...ids);}
              };
            })(""" + repr(f'data:image/png;base64,{preview}') + ')'
        )
        page.reload()
        page.get_by_role('button', name='选择图片', exact=True).click()
        page.wait_for_function("document.querySelector('.crop-selection__label')?.textContent === '1600 × 1200'")
        pixel = page.locator('.preview-stage').evaluate(
            """stage => {
              const canvas = stage.querySelector('.preview-canvas');
              const frame = stage.querySelector('cropper-canvas').getBoundingClientRect();
              const bounds = canvas.getBoundingClientRect();
              const x = (frame.x - bounds.x + frame.width / 4) * canvas.width / bounds.width;
              const y = (frame.y - bounds.y + frame.height / 4) * canvas.height / bounds.height;
              return Array.from(canvas.getContext('2d').getImageData(x,y,1,1).data);
            }"""
        )
        assert pixel == [255, 0, 0, 255], pixel
        page.locator('cropper-selection').evaluate(
            """s => {
              const {width,height} = s.parentElement.getBoundingClientRect();
              s.$change(width/4,height/4,width/2,height/2);
            }"""
        )
        等待绘制(page)
        page.get_by_role('button', name='下载编辑结果', exact=True).click()
        page.wait_for_function('window.桌面导出请求 !== null')
        edit = page.evaluate('window.桌面导出请求.edit')
        assert edit['裁剪区域'] == {'x': 400, 'y': 300, 'width': 800, 'height': 600}, edit
        assert edit['输出宽度'] == 800 and edit['输出高度'] == 600
        page.get_by_role('button', name='清空图片', exact=True).click()
        assert page.evaluate('window.已释放资源') == ['测试资源']

        touch_context = browser.new_context(
            viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True,
        )
        touch_page = touch_context.new_page()
        touch_page.on('pageerror', lambda error: errors.append(str(error)))
        touch_page.goto(f'{args.url}/tests/cropper-harness.html')
        touch_page.locator('input[type=file]').set_input_files(
            {'name': '触屏测试.png', 'mimeType': 'image/png', 'buffer': image}
        )
        touch_page.wait_for_function("document.querySelector('cropper-selection')?.width > 0")
        initial = 获取选框(touch_page)
        触屏拖动(touch_page, 'cropper-handle[action="se-resize"]', -50, -50)
        resized = 获取选框(touch_page)
        assert resized['width'] < initial['width'] and resized['height'] < initial['height']
        触屏拖动(touch_page, 'cropper-handle[action="move"]', 10, 10)
        moved = 获取选框(touch_page)
        assert moved['x'] > resized['x'] and moved['y'] > resized['y']
        touch_context.close()
        assert not errors, errors
        print('图片裁剪功能测试通过：鼠标与触屏拖拽、比例、边界、窗口缩放、变换、导出、极小图片、加载竞态、桌面坐标与资源清理')
        browser.close()


if __name__ == '__main__':
    main()
