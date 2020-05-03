import { generateWithPuppeteer} from '../src/PuppeteerImageGenerator';
import React from 'react';

describe('puppeteer generator', () => {
  it('does not throw', async () => {
    const Component: React.FC = () =>{
      return <span>Hello</span>
    }
    await generateWithPuppeteer(Component,{});
  })
})