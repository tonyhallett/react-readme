import * as fs from 'fs-extra';
import { IImageGenerator } from "./interfaces";

const repng: {
  (component: any, options: {
    css?: string;
    webfont?: string; // check assume this is a url
    type?: string; // jpeg, png ( default ) and pdf 
  }): any;
} = require('repng');
export class RepngImageGenerator implements IImageGenerator {
  async generate(component: any, path: string) {
    const image = await repng(component, {});
    const file = fs.createWriteStream(path);
    file.write(image);
    file.end();
  }
}
