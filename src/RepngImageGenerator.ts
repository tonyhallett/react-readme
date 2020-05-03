import * as fs from 'fs-extra';
import { IImageGenerator } from "./interfaces";

import {generateWithPuppeteer} from './PuppeteerImageGenerator'
export class RepngImageGenerator implements IImageGenerator {
  async generate(component: any, path: string) {
    const image = await generateWithPuppeteer(component,{});
    const file = fs.createWriteStream(path);
    file.write(image);
    file.end();
  }
}
