import { createElement } from 'react'
import puppeteer from 'puppeteer';
import  { renderToStaticMarkup } from 'react-dom/server';
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
type ScreenshotType = 'jpeg'|'png'|'pdf';
interface Options<P>{
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

  const props ={...{width: opts.width, height: opts.height},...opts.props};
  
  const pageContent = getPageContent(Component, props,css,webfont)
  

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