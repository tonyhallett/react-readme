import { IComponentFolderOptionsProvider } from "./AssetFolderProvider";
import { GlobalRootOptions } from "./AssetManagerOptions";

export interface IOptionsProvider{
    componentFolderOptionsProvider:IComponentFolderOptionsProvider,
    globalOptionsProvider:IGlobalOptionsProvider
}
export interface IGlobalOptionsProvider{
  getOptions(folderPath:string):Promise<GlobalRootOptions|undefined>
}

