import { IAssetManager, IGeneratedReadme, IGeneratedReadmeWriter, IPuppeteerImageGeneratorWriter, ComponentInfo } from './interfaces';
import { ComponentScreenshot } from './PuppeteerImageGenerator';
export default async function generate(
  assetManager: IAssetManager, 
  generatedReadMe: IGeneratedReadme, 
  generatedReadMeWriter: IGeneratedReadmeWriter, 
  puppeteerGeneratorWriter: IPuppeteerImageGeneratorWriter):Promise<void> {
    
    await assetManager.cleanComponentImages();
    const componentInfos = await assetManager.getComponentInfos();
    const componentScreenshots:ComponentScreenshot[] = componentInfos.map( componentInfo => {
      let componentScreenshot:ComponentScreenshot|undefined;
      let relativeComponentImagePath:string|undefined;
      if(componentInfo.componentScreenshot){
        const imageType = componentInfo.componentScreenshot.type === undefined ? 'png' : componentInfo.componentScreenshot.type;
        const componentImagePath = assetManager.getComponentImagePath(`${componentInfo.name}.${imageType}`);
        componentScreenshot = {
          ...componentInfo.componentScreenshot,
          id:componentImagePath
        }

        relativeComponentImagePath = generatedReadMeWriter.getRelativePath(componentImagePath);
      }
      
      
      generatedReadMe.addComponentGeneration(
        componentInfo.codeDetails, 
        componentInfo.readme, 
        componentScreenshot?
        { componentImagePath: relativeComponentImagePath!, 
          altText: componentInfo.altText?componentInfo.altText:'' 
        }:undefined
      );
      
      return componentScreenshot;
    }).filter(componentScreenshot => componentScreenshot!==undefined) as ComponentScreenshot[];

    generatedReadMe.surroundWith(
      await assetManager.readSurroundingReadme(true),
      await assetManager.readSurroundingReadme(false)
    );
    await puppeteerGeneratorWriter.generateAndWrite(componentScreenshots,assetManager.puppeteerLaunchOptions);
    await generatedReadMeWriter.write(generatedReadMe);
}
