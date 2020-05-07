import { IAssetManager, IGeneratedReadme, IGeneratedReadmeWriter, IPuppeteerImageGeneratorWriter } from './interfaces';
import { ComponentScreenshot } from './PuppeteerImageGenerator';
export default async function generate(
  assetManager: IAssetManager, 
  generatedReadMe: IGeneratedReadme, 
  generatedReadMeWriter: IGeneratedReadmeWriter, 
  puppeteerGeneratorWriter: IPuppeteerImageGeneratorWriter):Promise<void> {
    
    await assetManager.cleanComponentImages();
    const componentInfos = await assetManager.getComponentInfos();
    const componentScreenshots = componentInfos.map( componentInfo => {
      const imageType = componentInfo.componentScreenshot.type === undefined ? 'png' : componentInfo.componentScreenshot.type;
      const componentImagePath = assetManager.getComponentImagePath(`${componentInfo.name}.${imageType}`);
      const componentScreenshot:ComponentScreenshot = {
        ...componentInfo.componentScreenshot,
        id:componentImagePath
      }

      const relativeComponentImagePath = generatedReadMeWriter.getRelativePath(componentImagePath);
      generatedReadMe.addComponentGeneration(
        componentInfo.codeDetails, 
        componentInfo.readme, 
        { componentImagePath: relativeComponentImagePath, 
          altText: componentInfo.name 
        }
      );
      
      return componentScreenshot;
    });

    generatedReadMe.surroundWith(
      await assetManager.readSurroundingReadme(true),
      await assetManager.readSurroundingReadme(false)
    );
    await puppeteerGeneratorWriter.generateAndWrite(componentScreenshots,assetManager.puppeteerLaunchOptions);
    await generatedReadMeWriter.write(generatedReadMe);
}
