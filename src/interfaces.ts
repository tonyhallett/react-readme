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

export interface IImageGenerator{
  generate(component:any,path:string):Promise<void>
}
export interface IGeneratedReadmeWriter{
  write(generatedReadme:IGeneratedReadme):Promise<void>
  getRelativePath(path:string):string;
}
export interface IImageGeneratorFromFile{
  generate(componentFolderPath:string, outputPath:string):Promise<void>
}


export interface Demo{
  codeDetails:CodeDetails
  readme:string,
  name:string,
  folderPath:string

}
export interface IAssetManager{
  
  cleanComponentImages():Promise<void>
  getComponentImagePath(...parts:string[]):string;

  readSurroundingReadme(isPre:boolean):Promise<string>

  getComponentInfos():Promise<Array<Demo>>
}

