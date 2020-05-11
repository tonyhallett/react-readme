import {generateMultipleWithPuppeteer, ComponentScreenshot, PuppetterGenerationResult} from '../../src/PuppeteerImageGenerator'
import puppeteer from 'puppeteer'
import {createPage} from '../../src/PuppeteerImageGenerator/createPage'
import {determineWidthHeight} from '../../src/PuppeteerImageGenerator/determineWidthHeight'
import {takeScreenshot} from '../../src/PuppeteerImageGenerator/takeScreenshot' 
jest.mock('puppeteer');
jest.mock('../../src/PuppeteerImageGenerator/createPage');
jest.mock('../../src/PuppeteerImageGenerator/determineWidthHeight')
jest.mock('../../src/PuppeteerImageGenerator/takeScreenshot')


describe('puppeteer image generation', () => {
  beforeEach(()=> {
    jest.clearAllMocks();
  })
  describe('generateMultipleWithPuppeteer', () => {
    it('should launch puppeteer with the launch options', async() => {
      const mockLaunch = puppeteer.launch as jest.Mock;
      const mockBrowser = {
        close:()=>Promise.resolve()
      }
      mockLaunch.mockResolvedValue(mockBrowser);
      const puppeteerLaunchOptions={} as any;
      await generateMultipleWithPuppeteer([],puppeteerLaunchOptions);
      expect(mockLaunch.mock.calls[0][0]).toBe(puppeteerLaunchOptions);
    })

    const determinedWidth1 = 100;
    const determinedHeight1 = 100;
    const determinedWidth2 = 200;
    const determinedHeight2 = 200;
    const mockDetermineWidthAndHeight = determineWidthHeight as jest.Mock;

    const mockCreatePage = createPage as jest.Mock;
    const mockPage = {
      setViewport:jest.fn().mockResolvedValue(''),
      close:jest.fn().mockResolvedValue('')
    }
    
    const mockTakeScreenshot = takeScreenshot as jest.Mock;
    const fakeScreenshot1 = 'FakeBuffer1';
    const fakeScreenshot2 = 'FakeBuffer2';

    const mockBrowser = {
      close:jest.fn().mockResolvedValue('')
    }
    const componentScreenshots:ComponentScreenshot[] = [
      {
        //demonstrate default
        css:undefined,
        Component:function(){} as any,
        props:{some:'prop1'},
        webfont:'webfont1',
        id:'1',
        width:1,
        height:1,
        //no type - demonstrate default to png

      },
      {
        css:'Some css',
        Component:function(){} as any,
        props:{some:'prop2'},
        webfont:'webfont2',
        id:'2',
        width:2,
        height:2,
        type:'jpeg'
      }
    ]
    let result:PuppetterGenerationResult[]
    async function generateImages(){
      const mockLaunch = puppeteer.launch as jest.Mock;
      mockLaunch.mockResolvedValue(mockBrowser);
      mockCreatePage.mockResolvedValue(mockPage);
      mockDetermineWidthAndHeight
        .mockResolvedValueOnce({width: determinedWidth1,height: determinedHeight1})
        .mockResolvedValueOnce({width:determinedWidth2,height:determinedHeight2});
      mockTakeScreenshot.mockResolvedValueOnce(fakeScreenshot1).mockResolvedValueOnce(fakeScreenshot2)
      result = await generateMultipleWithPuppeteer(componentScreenshots,undefined);
    }
    describe('for each component screenshot', () => {
      beforeEach(async ()=> {
        await generateImages();
      })
      it('should create a page', () => {
        //undefined css defaults to ''
        expect(mockCreatePage).toHaveBeenNthCalledWith<Parameters<typeof createPage>>(
          1,mockBrowser as any,componentScreenshots[0].Component,componentScreenshots[0].props,'',componentScreenshots[0].webfont);

        expect(mockCreatePage).toHaveBeenNthCalledWith<Parameters<typeof createPage>>(
          2,mockBrowser as any,componentScreenshots[1].Component,componentScreenshots[1].props,componentScreenshots[1].css as any,componentScreenshots[1].webfont);
      })
      it('should set the viewport to the determined width and height', () => {
        expect(mockDetermineWidthAndHeight).toHaveBeenNthCalledWith<Parameters<typeof determineWidthHeight>>(
          1,mockPage as any,componentScreenshots[0].width,componentScreenshots[0].height);
        expect(mockDetermineWidthAndHeight).toHaveBeenNthCalledWith<Parameters<typeof determineWidthHeight>>(
          2,mockPage as any,componentScreenshots[1].width,componentScreenshots[1].height);

        expect(mockPage.setViewport).toHaveBeenNthCalledWith(1,{width:determinedWidth1,height:determinedHeight1});
        expect(mockPage.setViewport).toHaveBeenNthCalledWith(2,{width:determinedWidth2,height:determinedHeight2});
      })
      it('should take the screenshot, close the page and return the screenshot with id', () => {
        expect(mockTakeScreenshot).toHaveBeenNthCalledWith<Parameters<typeof takeScreenshot>>(1,mockPage as any,'png',determinedWidth1,determinedHeight1);
        expect(mockTakeScreenshot).toHaveBeenNthCalledWith<Parameters<typeof takeScreenshot>>(2,mockPage as any,'jpeg',determinedWidth2,determinedHeight2);
        expect(result[0]).toEqual({id:'1',image:fakeScreenshot1});
        expect(result[1]).toEqual({id:'2',image:fakeScreenshot2});
        expect(mockPage.close).toHaveBeenCalledTimes(2);
      })
      
    })

    it('should close the browser after closing the final page', async () => {
      await generateImages();
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
      const pageCloseInvocationOrder = mockPage.close.mock.invocationCallOrder;
      expect(mockBrowser.close.mock.invocationCallOrder[0]-pageCloseInvocationOrder[pageCloseInvocationOrder.length-1]).toBe(1);
    })
  })
});