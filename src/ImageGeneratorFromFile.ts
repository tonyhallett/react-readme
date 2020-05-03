import { IImageGeneratorFromFile, IImageGenerator } from "./interfaces";
import path from "path";

export interface IRequirer{
  require(id: string): any;
}

export class ImageGeneratorFromFile implements IImageGeneratorFromFile {
  constructor(private readonly imageGenerator: IImageGenerator, private readonly requirer: IRequirer) { }
  async generate(componentFolderPath: string, outputPath: string): Promise<void> {
    //need index.js now ?
    const component = this.requirer.require(path.join(componentFolderPath, 'index.js')).default;
    await this.imageGenerator.generate(component, outputPath);
  }
}
