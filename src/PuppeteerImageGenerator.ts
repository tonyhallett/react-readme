import { createElement } from 'react'
import puppeteer from 'puppeteer';
import { renderToStaticMarkup } from 'react-dom/server';
const Datauri = require('datauri')

const baseCSS = `*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif}`

const getHtmlData = ({
  body,
  baseCSS,
  css,
  styles,
  webfont
}:{body:string,baseCSS:string,css:string,styles:string,webfont:string}) => {
  const fontCSS = webfont ? getWebfontCSS(webfont) : ''
  const html = `<!DOCTYPE html>
    <head>
    <meta charset="utf-8"><style>${baseCSS}${fontCSS}${css}</style>
    ${styles}
    </head>
    <body style="display:inline-block">
    ${body}`
  return html
}

const getWebfontCSS = (fontpath:string) => {
  const { content } = new Datauri(fontpath)
  const [ name, ext ] = fontpath.split('/').slice(-1)[0].split('.')
  const css = (`@font-face {
  font-family: '${name}';
  font-style: normal;
  font-weight: 400;
  src: url(${content});
}`)
  return css
}
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

function getPageContent(Component:any,props:any,css:string,webfont:any){
  let styles = ''
  const el = createElement(Component, props)
  const body = renderToStaticMarkup(el)

  const html = getHtmlData({
    body,
    baseCSS,
    css,
    styles, // this is pointless assume should be providing in props
    webfont
  })
  return html;
}

export const generateWithPuppeteer = async <P>(Component : React.ComponentType<P>, opts:Options<P>) => {
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

async function takeScreenshot(page:puppeteer.Page,type:ScreenshotType,width:number,height:number){
  let result:Buffer
  if (type === 'pdf') {
    result =  await page.pdf({
      width,
      height,
    })
  } else {
    result = await page.screenshot({
      type: type,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
      },
      omitBackground: true
    })
  }
  return result;
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
    const pageContent = getPageContent(Component, opts.props,css,webfont)
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
    await page.close();
    return {
      image:result,
      id
    }
  }));
  
  await browser.close()
  return results;
  
}
