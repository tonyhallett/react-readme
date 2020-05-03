import { IAssetManagerOptions } from "./AssetManager";

export class ProcessAssetManagerOptions implements IAssetManagerOptions {
  readmeAssetsFolderPathArg() {
    return process.argv[2];
  }
}
