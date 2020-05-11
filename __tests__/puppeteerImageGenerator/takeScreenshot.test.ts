import {takeScreenshot} from '../../src/PuppeteerImageGenerator/takeScreenshot'
import { ScreenshotType } from '../../src/PuppeteerImageGenerator'
/*
export async function takeScreenshot(page: puppeteer.Page, type: ScreenshotType, width: number, height: number): Promise<Buffer> {
  let result: Buffer;
  if (type === 'pdf') {
    result = await page.pdf({
      width,
      height,
    });
  }
  else {
    result = await page.screenshot({
      type: type,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
      },
      omitBackground: true
    });
  }
  return result;
}
*/
describe('takeScreenshot', () => {
  it('should return page.pdf buffer if type is pdf at desired width and height', async () => {
    const dimensions = {
      width:100,
      height:200
    }
    const page = {
      pdf:jest.fn().mockResolvedValue('pdf buffer')
    }
    const result = await takeScreenshot(page as any, 'pdf',dimensions.width,dimensions.height);
    expect(result).toBe('pdf buffer');
    expect(page.pdf).toHaveBeenCalledWith(dimensions)
  })
  const jpegPng:ScreenshotType[] = ['jpeg','png'];
  jpegPng.forEach(screenshotType => {
    it(`should page.screenshot clipping top size and omitting background - ${screenshotType}`,async () => {
      const dimensions = {
        width:100,
        height:200
      }
      const page = {
        screenshot:jest.fn().mockResolvedValue('screenshot buffer')
      }
      const result = await takeScreenshot(page as any, screenshotType,dimensions.width,dimensions.height);
      expect(result).toBe('screenshot buffer');
      expect(page.screenshot).toHaveBeenCalledWith({
        type:screenshotType,
        clip:{
          x:0,
          y:0,
          ...dimensions
        },
        omitBackground:true
      })
    })
  })
})