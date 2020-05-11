import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getHtmlData } from './getHtmlData';

export const baseCSS = `*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif}`
export function getPageContent(Component: any, props: any, css: string, webfont: any): string {
  /*
    not used in the original repo that have refactored and slightly amended.
    Keeping as a reminder that may wish to add to options
  */
  let styles = ''; 
  
  
  const el = createElement(Component, props);
  const body = renderToStaticMarkup(el);
  const html = getHtmlData({
    body,
    baseCSS,
    css,
    styles,
    webfont
  });
  return html;
}
