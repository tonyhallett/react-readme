import { getWebfontCSS } from "./getWebfontCss"

export function getHtmlData({
  body,
  baseCSS,
  css,
  styles,
  webfont
}:{body:string,baseCSS:string,css:string,styles:string,webfont:string}){
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