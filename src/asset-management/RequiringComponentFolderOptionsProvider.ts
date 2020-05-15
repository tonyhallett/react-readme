import { IComponentFolderOptionsProvider } from "./AssetFolderProvider";
import { ReactReadmeRequirer } from "../ReactReadmeRequirer";
import { ComponentOptions } from "./AssetManager";
import { CodeDetails } from "../interfaces";
import { ILanguageReader } from "./LanguageReader";
export interface IResolvedObjectPathFinder{
  resolve(resolvedObject:any, exclude:string):{path:string,key:string|undefined}|undefined;
}
export interface IOptionsParser{
  getComponentCode(filePath:string):string|undefined
}

class ErrorWrapper extends Error{
  private constructor(message:string,public readonly cause:any){
    super(message)
  }
  static create(message:string,cause:any){
    let fullMessage = message;
    if(cause.message){
      fullMessage+='\n';
      fullMessage+=cause.message;
    }
    return new ErrorWrapper(fullMessage,cause);
  }
}

export class RequiringComponentFolderOptionsProvider implements IComponentFolderOptionsProvider{
  constructor(
    private readonly readmeRequirer:ReactReadmeRequirer, 
    private readonly resolvedObjectPathFinder:IResolvedObjectPathFinder,
    private readonly languageReader:ILanguageReader,
    private readonly optionsParser:IOptionsParser
    ){}
  async getComponentCode(componentAssetFolderPath: string,isJs:boolean): Promise<CodeDetails> {
    const path = this.readmeRequirer.getReactReadmeInFolder(componentAssetFolderPath);
    const result = await this.languageReader.find(path,isJs);
    if(result){
      let parsedCode:string|undefined;
      try{
        parsedCode = this.optionsParser.getComponentCode(result.readPath);
      }catch(e){
        throw ErrorWrapper.create(`error parsing component in ${result.readPath}`,e)
      }
      if(parsedCode===undefined||parsedCode===''){
        throw new Error(`could not parse component in ${result.readPath}`)
      }
      return {
        code:parsedCode||'',
        language:result.language
      }
    }
    const searchPaths = this.languageReader.searchPaths(path,isJs);
    if(searchPaths.length===1){
      throw new Error(`Cannot find ${searchPaths[0]}`);
    }
    throw new Error(`Cannot find one of ${searchPaths.join()}`);
  }
  async getOptions(componentFolderPath: string): Promise<ComponentOptions | undefined> {
    if(await this.readmeRequirer.exists(componentFolderPath)){
      const options = this.readmeRequirer.read<ComponentOptions>(componentFolderPath);
      if(options.component && options.componentPath === undefined){
        const resolved =  this.resolvedObjectPathFinder.resolve(
          options.component,
          this.readmeRequirer.getReactReadmeInFolder(componentFolderPath));
        if(resolved){
          options.componentPath = resolved.path;
          options.componentKey = resolved.key;
        }
      }
      return options;
    }
  }
  
}