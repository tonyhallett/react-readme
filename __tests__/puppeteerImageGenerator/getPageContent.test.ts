import {getPageContent, baseCSS} from '../../src/PuppeteerImageGenerator/getPageContent';
import {getHtmlData} from '../../src/PuppeteerImageGenerator/getHtmlData';
import {createElement} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('react');
jest.mock('react-dom/server');
jest.mock('../../src/PuppeteerImageGenerator/getHtmlData');

describe('getPageContent', () => {
  it('should render to static markup the Component and its props and create html string including the other parameters and base css', () => {
    const mockCreateElement = createElement as jest.Mock;
    mockCreateElement.mockReturnValue('<CreatedElement prop1/>');

    const mockRenderToStaticMarkup = renderToStaticMarkup as jest.Mock;
    const renderedToStaticMarkup = '<div>From render()</div>';
    mockRenderToStaticMarkup.mockReturnValue(renderedToStaticMarkup);

    const mockGetHtmlData = getHtmlData as jest.Mock;
    mockGetHtmlData.mockReturnValue('<html>...');

    const Component = function(){} as any;
    const props= {prop1:true};
    const css='css';
    const webfont = 'webfont';

    const result = getPageContent(Component,props,css,webfont);

    expect(result).toBe('<html>...');
    expect(mockCreateElement).toHaveBeenCalledWith(Component,props);
    expect(mockRenderToStaticMarkup).toHaveBeenCalledWith('<CreatedElement prop1/>');
    const expectedHtmlData:Parameters<typeof getHtmlData>[0]= {
      baseCSS,
      body:renderedToStaticMarkup,
      css,
      styles:'',//not being used currently
      webfont
    }
    expect(mockGetHtmlData).toHaveBeenCalledWith(expectedHtmlData)

  })
})