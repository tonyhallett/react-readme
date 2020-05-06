import { generateWithPuppeteer, generateMultipleWithPuppeteer, ComponentScreenshot} from '../src/PuppeteerImageGenerator';
import React from 'react';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('puppeteer generator', () => {
  it('should not throw', async () => {
    const Component: React.FC = () =>{
      return <span>Hello</span>
    }
    await generateWithPuppeteer(Component,{});
  })

  it.skip('should not throw with multiple', async () => {
    const Component: React.FC = () =>{
      return <span>Hello</span>
    }
    const numShots = 80;
    const multiple:Array<ComponentScreenshot>=[];
    for(let i=0;i<numShots;i++){
      multiple.push({Component});
    }
    await generateMultipleWithPuppeteer(multiple);
  },60000);

  test('visual inspection of generated images', async () => {
    const Component: React.FC = () =>{
      return <span style={{backgroundColor:'white'}}>Hello</span>
    }
    
    const multiple:Array<ComponentScreenshot>=[
      {
        Component,
      },
      {
        Component,
        width:50,
        height:50
      },
      {
        Component,
        width:100,
        height:100
      },

    ];
    
    const results = await generateMultipleWithPuppeteer(multiple);
    const screenshotsFolder = path.join(__dirname,'..','__test__screenshots');
    await fs.ensureDir(screenshotsFolder);
    for(const result of results){
      await fs.writeFile(path.join(screenshotsFolder,`${result.id}.png`),result.image);
    }
  },60000);

})