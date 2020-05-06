import { IGeneratedReadmeWriter, IGeneratedReadme, ISystem } from "./interfaces";
import path from "path";
import * as fs from 'fs-extra';

export class GeneratedReadmeWriter implements IGeneratedReadmeWriter {
  constructor(private readonly system:ISystem,private readonly readmeFileName:string){}
  getRelativePath(to: string): string {
    //return path.relative(process.cwd(), to);
    return this.system.path.relative(this.system.cwd,to);
  }
  async write(readme: IGeneratedReadme) {
    await this.system.fs.writeFile(this.system.path.absoluteOrCwdRelative(this.readmeFileName),readme.toString());
    //await fs.writeFile(path.join(process.cwd(), this.readmeFileName), readme.toString());
  }
  
}