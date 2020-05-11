import generate from "./generate";
import { GeneratedReadme } from "./GeneratedReadme";
import { createGeneratedReadmeWriter } from "./GeneratedReadmeWriter";
import { generateMultipleWithPuppeteer } from "./PuppeteerImageGenerator";
import { PuppeteerImageGeneratorWriter } from "./PuppeteerImageGeneratorWriter";
import { System } from "./System";
import { markdownCodeCreator, createMarkdownImageCreator } from "./GeneratedReadme/readMePartCreators";
import { newlineSpacer } from "./GeneratedReadme/newlineSpacer";
import { createFolderRequiringAssetManager } from "./asset-management/FolderRequiringAssetManager";
import { requirer } from "./Requirer"
import { encoder} from "./GeneratedReadme/Encoder"
import { SuffixComponentSorter } from "./SuffixComponentSorter";
export const generateReadme = async () => {
  const system = new System();
  await generate(
    await createFolderRequiringAssetManager(system,requirer, new SuffixComponentSorter()),
    new GeneratedReadme(
      markdownCodeCreator,
      createMarkdownImageCreator(encoder),
      newlineSpacer
    ),
    createGeneratedReadmeWriter(system),
    new PuppeteerImageGeneratorWriter(generateMultipleWithPuppeteer,system)
  )
}
