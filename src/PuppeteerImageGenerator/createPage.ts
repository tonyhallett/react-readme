import puppeteer from 'puppeteer';
import { getPageContent } from './getPageContent';

export async function createPage(
  browser:puppeteer.Browser, 
  Component:any,
  props:any|undefined,
  css:string,
  webfont:string|undefined){

    const pageContent = getPageContent(Component, props,css,webfont)
    const page = await browser.newPage()
    await page.setContent(pageContent)
    return page;
  }