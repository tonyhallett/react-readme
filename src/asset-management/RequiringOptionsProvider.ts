import { IComponentFolderOptionsProvider } from "./AssetFolderProvider";
import { RequiringComponentFolderOptionsProvider, IResolvedObjectPathFinder } from "./RequiringComponentFolderOptionsProvider";
import { ReactReadmeRequirer } from "../ReactReadmeRequirer";
import { ISystem, IRequirer } from "../interfaces";
import { IOptionsProvider, IGlobalOptionsProvider } from "./IOptionsProvider";
import { RequiringGlobalOptionsProvider } from "./RequiringGlobalOptionsProvider";
import { LanguageReader } from "./LanguageReader";
import { TypescriptOptionsParser } from "./TypescriptOptionsParser";
export class RequiringOptionsProvider implements IOptionsProvider {
  componentFolderOptionsProvider: IComponentFolderOptionsProvider;
  globalOptionsProvider: IGlobalOptionsProvider;
  constructor(system: ISystem, requirer: IRequirer, resolvedObjectPathFinder: IResolvedObjectPathFinder) {
    const readmeRequirer = new ReactReadmeRequirer(system, requirer);
    this.componentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider(
      readmeRequirer, resolvedObjectPathFinder, 
      new LanguageReader(system), new TypescriptOptionsParser(system));
    this.globalOptionsProvider = new RequiringGlobalOptionsProvider(readmeRequirer);
  }
}
