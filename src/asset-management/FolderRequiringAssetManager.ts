import { IAssetManager, IRequirer, ISystem } from "../interfaces";
import { AssetManager } from "./AssetManager";
import { AssetFolderProvider, IComponentSorter } from "./AssetFolderProvider";
import { AssetManagerOptions } from "./AssetManagerOptions";
import { IOptionsProvider } from "./IOptionsProvider";
import { RequiringOptionsProvider } from "./RequiringOptionsProvider";
import { ResolvedObjectPathFinder } from "./ResolvedObjectPathFinder";

export async function createFolderRequiringAssetManager(system:ISystem,requirer:IRequirer,componentSorter:IComponentSorter):Promise<IAssetManager>{
  const optionsProvider:IOptionsProvider = new RequiringOptionsProvider(system, requirer, new ResolvedObjectPathFinder(requirer));
  const assetManagerOptions = new AssetManagerOptions(system, optionsProvider.globalOptionsProvider);
  await assetManagerOptions.init();
  const assetManager = new AssetManager(
    assetManagerOptions, 
    new AssetFolderProvider(
      system,
      requirer,
      optionsProvider.componentFolderOptionsProvider,
      componentSorter),
    system)
  return assetManager;
}

