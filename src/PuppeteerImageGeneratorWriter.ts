import {IPuppeteerImageGeneratorWriter, ISystem} from './interfaces'
import { PuppeteerGenerator, ComponentScreenshot } from './PuppeteerImageGenerator'
import { LaunchOptions } from 'puppeteer'
import * as fs from 'fs-extra';
export class PuppeteerImageGeneratorWriter implements IPuppeteerImageGeneratorWriter{
  constructor(private readonly generator:PuppeteerGenerator,private readonly system:ISystem){}
  async generateAndWrite(componentScreenshots: ComponentScreenshot<{}>[], puppeteerOptions?: LaunchOptions | undefined): Promise<void> {
    const results = await this.generator(componentScreenshots,puppeteerOptions);
    for(const result of results){
      await this.system.fs.writeFileBuffer(result.id,result.image);
    }
  }

}