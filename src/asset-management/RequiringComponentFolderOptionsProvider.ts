import { IComponentFolderOptionsProvider } from "./AssetFolderProvider";
import { ReactReadmeRequirer } from "../ReactReadmeRequirer";
import { FolderOptions } from "./AssetManager";
export interface IResolvedObjectPathFinder{
  getResolvedPath(resolvedObject:any):string|undefined;
}

export class RequiringComponentFolderOptionsProvider implements IComponentFolderOptionsProvider{
  constructor(private readonly readmeRequirer:ReactReadmeRequirer, private readonly resolvedObjectPathFinder:IResolvedObjectPathFinder){}
  async getOptions(componentFolderPath: string): Promise<FolderOptions | undefined> {
    if(await this.readmeRequirer.exists(componentFolderPath)){
      const options = this.readmeRequirer.read<FolderOptions>(componentFolderPath);
      if(options.component && options.componentPath === undefined){
        options.componentPath = this.resolvedObjectPathFinder.getResolvedPath(options.component);
      }
      return options;
    }
  }
}