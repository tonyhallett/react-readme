import { IAssetManager, IGeneratedReadme, IGeneratedReadmeWriter, IImageGeneratorFromFile } from './interfaces';
export default async function generate(assetManager: IAssetManager,  generatedReadMe: IGeneratedReadme, generatedReadMeWriter: IGeneratedReadmeWriter, imageGenerator: IImageGeneratorFromFile) {
  assetManager.cleanComponentImages();
  const componentInfos = await assetManager.getComponentInfos();
  await Promise.all(componentInfos.map(async (componentInfo) => {
    const componentImagePath = assetManager.getComponentImagePath(`${componentInfo.name}.png`);

    await imageGenerator.generate(componentInfo.folderPath, componentImagePath);
    
    const relativeComponentImagePath = generatedReadMeWriter.getRelativePath(componentImagePath);
    generatedReadMe.addDemo(
      componentInfo.codeDetails, 
      componentInfo.readme, 
      { componentImagePath: relativeComponentImagePath, 
        altText: componentInfo.name 
      }
    );
  }));
  generatedReadMe.surroundWith(
    await assetManager.readSurroundingReadme(true),
    await assetManager.readSurroundingReadme(false)
  );
  await generatedReadMeWriter.write(generatedReadMe);
}
