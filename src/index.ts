import generate from "./generate";
import { AssetManager } from "./asset-management/AssetManager";
import { AssetFolderProvider } from "./asset-management/AssetFolderProvider";
import { AssetManagerOptions } from "./asset-management/AssetManagerOptions";
import { GeneratedReadme } from "./GeneratedReadme";
import { GeneratedReadmeWriter } from "./GeneratedReadmeWriter";
import { generateMultipleWithPuppeteer } from "./PuppeteerImageGenerator";
import { PuppeteerImageGeneratorWriter } from "./PuppeteerImageGeneratorWriter";
import { System } from "./System";
import { IRequirer } from "./interfaces";
import { SuffixComponentSorter } from "./SuffixComponentSorter";
import { ResolvedObjectPathFinder } from "./asset-management/ResolvedObjectPathFinder";
import { IOptionsProvider, RequiringOptionsProvider } from "./asset-management/IOptionsProvider";

export const generateReadme = async () => {
  const system = new System();
  const requirer:IRequirer = {require}
  const optionsProvider:IOptionsProvider = new RequiringOptionsProvider(system, requirer, new ResolvedObjectPathFinder(require));
  const assetManagerOptions = new AssetManagerOptions(system, optionsProvider.globalOptionsProvider);
  await assetManagerOptions.init();
  await generate(
    new AssetManager(
      assetManagerOptions, 
      new AssetFolderProvider(
        system,
        requirer,
        optionsProvider.componentFolderOptionsProvider,
        new SuffixComponentSorter()),
      system),
    new GeneratedReadme(),
    new GeneratedReadmeWriter(system,'README.md'),
    new PuppeteerImageGeneratorWriter(generateMultipleWithPuppeteer,system)
  )
}
