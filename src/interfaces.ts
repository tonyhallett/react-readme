import puppeteer from 'puppeteer';
import { ReadUntilExistsResult } from "./helpers";
import { ComponentScreenshot, ComponentScreenshotOptions } from './PuppeteerImageGenerator';

export interface CodeDetails{
  code:string,
  language:string
}
export interface ImageDetails{
  componentImagePath: string, 
  altText:string
}
export interface IGeneratedReadme{
  addDemo(codeDetails: CodeDetails, readme: string, imageDetails:ImageDetails):void
  surroundWith(pre:string,post:string):void
  toString():string
}

export interface IPuppeteerImageGeneratorWriter{
  generateAndWrite(componentScreenshots:Array<ComponentScreenshot>,puppeteerOptions?:puppeteer.LaunchOptions):Promise<void>
}
export interface IGeneratedReadmeWriter{
  write(generatedReadme:IGeneratedReadme):Promise<void>
  getRelativePath(path:string):string;
}

export interface ImageGenerationDetail {
  componentFolderPath:string,
  savePath:string
}
export interface IImageGeneratorFromFile{
  generate(imageGenerationDetails:Array<ImageGenerationDetail>):Promise<void>
}

export interface ComponentInfo {
  codeDetails:CodeDetails
  readme:string,
  name:string,
  componentScreenshot:ComponentScreenshotOptions&{type?:'jpeg'|'png'}& {Component:React.ComponentType}
}

export interface IAssetManager{
  puppeteerLaunchOptions:puppeteer.LaunchOptions|undefined;
  
  cleanComponentImages():Promise<void>
  getComponentImagePath(...parts:string[]):string;

  readSurroundingReadme(isPre:boolean):Promise<string>

  getComponentInfos():Promise<Array<ComponentInfo>>
}

export interface Path{
  relative(from: string, to: string):string;
  isAbsolute(jsPath: string):boolean;
  join(...paths:string[]):string
  exists(path:string):Promise<boolean>
  extname(file:string):string,
  absoluteOrCwdRelative(path:string):string
}
export interface FS{
  writeFile(path: string, data: string):Promise<void>
  emptyDir(path:string):Promise<void>
  readUntilExists(...paths:string[]):Promise<ReadUntilExistsResult>
  readdir(dir:string):Promise<string[]>
  readFileString(filePath:string):Promise<string>

}
export interface ISystem {
  path: Path;
  fs: FS;
  cwd:string
}

export interface IRequirer{
  require(id: string): any;
}

export interface IReactReadme{
  exists(folderPath:string):Promise<boolean>
  read<T extends object>(folderPath:string):Promise<T>
}
