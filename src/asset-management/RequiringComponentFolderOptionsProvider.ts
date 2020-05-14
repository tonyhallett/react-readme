import { IComponentFolderOptionsProvider } from "./AssetFolderProvider";
import { ReactReadmeRequirer } from "../ReactReadmeRequirer";
import { ComponentOptions } from "./AssetManager";
import { CodeDetails } from "../interfaces";
export interface IResolvedObjectPathFinder{
  resolve(resolvedObject:any, exclude:string):{path:string,key:string|undefined}|undefined;
}

export class RequiringComponentFolderOptionsProvider implements IComponentFolderOptionsProvider{
  constructor(
    private readonly readmeRequirer:ReactReadmeRequirer, 
    private readonly resolvedObjectPathFinder:IResolvedObjectPathFinder){}
  getComponentCode(componentAssetFolderPath: string): Promise<CodeDetails> {
    throw new Error("Method not implemented.");
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