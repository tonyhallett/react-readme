import generate from "./generate";
import { AssetManager } from "./AssetManager";
import { ProcessAssetManagerOptions } from "./ProcessAssetManagerOptions";
import { GeneratedReadme } from "./GeneratedReadme";
import { GeneratedReadmeWriter } from "./GeneratedReadmeWriter";
import { ImageGeneratorFromFile } from "./ImageGeneratorFromFile";
import { RepngImageGenerator } from "./RepngImageGenerator";

export const generateReadme = async () => {
  await generate(
    new AssetManager(new ProcessAssetManagerOptions()),
    new GeneratedReadme(),
    new GeneratedReadmeWriter(),
    new ImageGeneratorFromFile(
      new RepngImageGenerator(),
      {
        require:require
      }
    )
  )
}