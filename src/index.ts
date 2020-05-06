import generate from "./generate";
import { AssetManager, AssetFolderProvider } from "./AssetManager";
import { AssetManagerOptions } from "./AssetManagerOptions";
import { GeneratedReadme } from "./GeneratedReadme";
import { GeneratedReadmeWriter } from "./GeneratedReadmeWriter";
import { generateMultipleWithPuppeteer } from "./PuppeteerImageGenerator";
import { PuppeteerImageGeneratorWriter } from "./PuppeteerImageGeneratorWriter";
import { System } from "./System";
import { ReactReadme } from "./ReactReadme";
import { IRequirer } from "./interfaces";
import { SuffixComponentSorter } from "./SuffixComponentSorter";

export const generateReadme = async () => {
  const system = new System();
  const requirer:IRequirer = {require}
  const reactReadme = new ReactReadme(system,requirer)
  
  await generate(
    new AssetManager(
      new AssetManagerOptions(system, reactReadme), 
      new AssetFolderProvider(system,requirer,reactReadme,new SuffixComponentSorter()),
      system),
    new GeneratedReadme(),
    new GeneratedReadmeWriter(system,'README.md'),
    new PuppeteerImageGeneratorWriter(generateMultipleWithPuppeteer)
  )
}