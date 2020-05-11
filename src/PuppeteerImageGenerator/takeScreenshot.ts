import puppeteer from 'puppeteer';
import { ScreenshotType } from './index';
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
