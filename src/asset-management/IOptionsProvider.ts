import { IComponentFolderOptionsProvider } from "./AssetFolderProvider";
import { GlobalRootOptions } from "./AssetManagerOptions";
import { RequiringComponentFolderOptionsProvider, IResolvedObjectPathFinder } from "./RequiringComponentFolderOptionsProvider";
import { ReactReadmeRequirer } from "../ReactReadmeRequirer";
import { ISystem, IRequirer } from "../interfaces";

export interface IOptionsProvider{
    componentFolderOptionsProvider:IComponentFolderOptionsProvider,
    globalOptionsProvider:IGlobalOptionsProvider
}
export interface IGlobalOptionsProvider{
  getOptions(folderPath:string):Promise<GlobalRootOptions|undefined>
}

export class RequiringOptionsProvider implements IOptionsProvider{
  componentFolderOptionsProvider:IComponentFolderOptionsProvider
  globalOptionsProvider:IGlobalOptionsProvider
  constructor(system:ISystem, requirer:IRequirer,resolvedObjectPathFinder:IResolvedObjectPathFinder){
    const readmeRequirer = new ReactReadmeRequirer(system, requirer);
    this.componentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider(readmeRequirer,resolvedObjectPathFinder);
    this.globalOptionsProvider = new RequiringGlobalOptionsProvider(readmeRequirer);
  }
}

class RequiringGlobalOptionsProvider implements IGlobalOptionsProvider{
  constructor(private readonly reactReadme:ReactReadmeRequirer){}
  async getOptions(folderPath: string): Promise<GlobalRootOptions | undefined> {
    if(await this.reactReadme.exists(folderPath)){
      return this.reactReadme.read<GlobalRootOptions>(folderPath)
    }
  }

}