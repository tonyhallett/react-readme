const Datauri = require('datauri')
export const getWebfontCSS = (fontpath:string) => {
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