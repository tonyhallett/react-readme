import {createPage} from '../../src/PuppeteerImageGenerator/createPage';
import {getPageContent} from '../../src/PuppeteerImageGenerator/getPageContent'

jest.mock('../../src/PuppeteerImageGenerator/getPageContent')

describe('createPage', () => {
  it('should create and return a new page and set content based on the Component, its props, css and webfont', async () => {
    const mockGetPageContent = getPageContent as jest.Mock;
    mockGetPageContent.mockReturnValue('the page content');

    const pageSetContent = jest.fn().mockResolvedValue('');
    const newPage = {
      setContent:pageSetContent
    }
    const browser = {
      newPage:jest.fn().mockResolvedValue(newPage)
    }
    const Component = function(){} as any;
    const props = {prop1:'value1'};
    const css ='Some css';
    const webfont = 'webfont';
    const createdPage = await createPage(browser as any,Component,props, css, webfont);
    expect(createdPage).toBe(newPage);
    expect(newPage.setContent).toHaveBeenCalledWith('the page content');
    expect(mockGetPageContent).toHaveBeenCalledWith<Parameters<typeof getPageContent>>(Component,props,css,webfont);
  })
})