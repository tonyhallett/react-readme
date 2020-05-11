import puppeteer from 'puppeteer';
export async function determineWidthHeight(page: puppeteer.Page, optionsWidth: number | undefined, optionsHeight: number | undefined) {
  if((optionsWidth!==undefined&& optionsWidth<0)||(optionsHeight!==undefined&& optionsHeight<0)){
    throw new Error('Negative width or height for puppeteer screenshot');
  }
  let rect = { width: 0, height: 0 };
  if (!optionsWidth || !optionsHeight) {
    const bodyEl = await page.$('body');
    const r = await bodyEl!.boxModel();
    rect = r!;
  }
  const width = optionsWidth || rect.width;
  const height = optionsHeight || rect.height;
  return {
    width,
    height
  };
}
