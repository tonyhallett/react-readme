import puppeteer from 'puppeteer';
import { takeScreenshot } from './takeScreenshot';
import { determineWidthHeight } from './determineWidthHeight';
import { getPageContent } from './getPageContent';
import { createPage } from './createPage';


export type ScreenshotType = 'jpeg'|'png'|'pdf';
export interface Options<P>{
  css?:string,
  webfont?:any,
  type?:ScreenshotType,
  width?:number,
  height?:number,
  props?:P,
  puppeteer?:puppeteer.LaunchOptions
}

export const generateWithPuppeteer = async <P>(Component : React.ComponentType<P>, opts:Options<P>):Promise<Buffer> => {
  const {
    css = '',
    webfont,
    type = 'png',
  } = opts

  
  const pageContent = getPageContent(Component, opts.props,css,webfont)
  

  const browser = await puppeteer.launch(opts.puppeteer)
  const page = await browser.newPage()
  await page.setContent(pageContent)

  let rect = {width:0,height:0}
  if (!opts.width && !opts.height) {
    const bodyEl = await page.$('body')
    const r = await bodyEl!.boxModel();
    rect = r!;
  }
  const width = opts.width || rect.width;
  const height = opts.height || rect.height;

  await page.setViewport({
    width,
    height,
  })

  const result = await takeScreenshot(page,type,width, height);
  await browser.close()

  return result
}

export type ComponentScreenshotOptions<P={}> = Omit<Options<P>,'puppeteer'>
export type ComponentScreenshot<P={}> = ComponentScreenshotOptions<P> & {Component:React.ComponentType<P>,id?:any}

export interface PuppetterGenerationResult{
  image:Buffer,
  id:any
}
export type PuppeteerGenerator = (componentScreenshots:Array<ComponentScreenshot>,puppeteerOptions?:puppeteer.LaunchOptions)=>Promise<Array<PuppetterGenerationResult>>

export const generateMultipleWithPuppeteer:PuppeteerGenerator = async (componentScreenshots:Array<ComponentScreenshot>,puppeteerOptions:puppeteer.LaunchOptions={}) => {
  const browser = await puppeteer.launch(puppeteerOptions);
  const results = await Promise.all(componentScreenshots.map(async (componentScreenshot, i) => {
    const {Component,...opts} = componentScreenshot;
    const {
      css = '',
      webfont,
      type = 'png',
      id
    } = opts

    const page = await createPage(browser,Component,opts.props,css,webfont)

    const {width,height} = await determineWidthHeight(page,opts.width,opts.height);
    
    //is this even necessary ?
    await page.setViewport({
      width,
      height,
    })
  
    const result = await takeScreenshot(page,type,width, height);
    await page.close();
    return {
      image:result,
      id
    }
  }));
  
  await browser.close()
  return results;
}
