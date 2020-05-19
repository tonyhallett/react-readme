import { IComponentFolderOptionsProvider, PropsCodeDetails } from "./AssetFolderProvider";
import { ReactReadmeRequirer } from "../ReactReadmeRequirer";
import { ComponentOptions } from "./AssetManager";
import { CodeDetails } from "../interfaces";
import { ILanguageReader } from "./LanguageReader";
import { ErrorWrapper } from "./ErrorWrapper";
export interface IResolvedObjectPathFinder{
  resolve(resolvedObject:any, exclude:string):{path:string,key:string|undefined}|undefined;
}
export interface IOptionsParser{
  getComponentCode(filePath:string,code:string):string|undefined,
  getPropsCode(filePath:string, code:string):string[]|undefined
}

export class RequiringComponentFolderOptionsProvider implements IComponentFolderOptionsProvider{
  constructor(
    private readonly readmeRequirer:ReactReadmeRequirer, 
    private readonly resolvedObjectPathFinder:IResolvedObjectPathFinder,
    private readonly languageReader:ILanguageReader,
    private readonly optionsParser:IOptionsParser
    ){}
  getPropsCode(componentAssetFolderPath: string, isJs: boolean): Promise<PropsCodeDetails> {
    return this.common(componentAssetFolderPath,isJs,(readPath,code)=>this.optionsParser.getPropsCode(readPath,code),'props');
  }
  private async common<T extends string[]|string>(
    componentAssetFolderPath: string,
    isJs:boolean,
    parse:(readPath:string,code:string)=>T|undefined,
    erroredParsingMessage:string){
    
      const path = this.readmeRequirer.getReactReadmeInFolder(componentAssetFolderPath);
      const result = await this.languageReader.read(path,isJs);
      if(result){
        let parsedCode:T|undefined;
        try{
          parsedCode = parse(result.readPath,result.code);
        }catch(e){
          throw ErrorWrapper.create(`error parsing ${erroredParsingMessage} in ${result.readPath}`,e)
        }
        if(parsedCode===undefined){
          throw new Error(`could not parse ${erroredParsingMessage} in ${result.readPath}`)
        }
        return {
          code:parsedCode!,
          language:result.language
        }
      }
      const searchPaths = this.languageReader.searchPaths(path,isJs);
      if(searchPaths.length===1){
        throw new Error(`Cannot find ${searchPaths[0]}`);
      }
      throw new Error(`Cannot find one of ${searchPaths.join()}`);
  }
  async getComponentCode(componentAssetFolderPath: string,isJs:boolean): Promise<CodeDetails> {
    return this.common(componentAssetFolderPath,isJs,(readPath,code)=>this.optionsParser.getComponentCode(readPath,code),'component');
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