import path from 'path';
import * as fs from 'fs-extra';
import { readFileString, readUntilExists } from './helpers';
import { IAssetManager, CodeDetails, Demo } from './interfaces';

export interface IAssetManagerOptions{
  readmeAssetsFolderPathArg():string
}
export class AssetManager implements IAssetManager {
  private readmeAssetsFolderPath!: string;
  private readonly defaultReadmeAssets = 'README-assets';
  private languageLookup: Array<{
    extension: string;
    language: string;
  }> = [
      // typescript files first
      {
        language: 'typescript',
        extension: '.ts'
      },
      {
        language: 'tsx',
        extension: '.tsx'
      },
      {
        language: 'javascript',
        extension: '.js'
      },
    ];
  private componentImagesFolderPath!: string;

  constructor(options:IAssetManagerOptions){
    this.readmeAssetsFolderPath = options.readmeAssetsFolderPathArg() || this.defaultReadmeAssets;
    if (!path.isAbsolute(this.readmeAssetsFolderPath)) {
      this.readmeAssetsFolderPath = path.join(process.cwd(), this.readmeAssetsFolderPath);
    }
    this.componentImagesFolderPath = path.join(this.readmeAssetsFolderPath, 'images'); 
  }
  
  private pathInReadmeAssetsFolder(...parts: string[]) {
    return path.join(...([this.readmeAssetsFolderPath].concat(parts)));
  }
  async cleanComponentImages() {
    fs.emptyDir(this.componentImagesFolderPath);
  }
  getComponentImagePath(...parts: string[]): string {
    return path.join(...([this.componentImagesFolderPath].concat(parts)));
  }
  async readSurroundingReadme(isPre: boolean) {
    const readmePaths: string[] = isPre ? ['README.md', 'READMEPre.md'] : ['READMEPost.md'];
    const { read } = await readUntilExists(...readmePaths.map(readmeName => this.pathInReadmeAssetsFolder(readmeName)));
    return read;
  }
  private async readDemoCode(folderPath: string): Promise<CodeDetails> {
    const { didRead, read, readPath } = await readUntilExists(...this.languageLookup.map(entry => path.join(folderPath, `index${entry.extension}`)));
    if (!didRead) {
      throw new Error('no component file found');
    }
    return {
      code: read,
      language: this.languageLookup.find(entry => entry.extension === path.extname(readPath!))!.language
    };
  }
  private async readComponentReadMe(folderPath: string) {
    const readmePath = path.join(folderPath, 'README.md');
    const exists = await fs.pathExists(readmePath);
    let componentReadMe = '';
    if (exists) {
      componentReadMe = await readFileString(readmePath);
    }
    return componentReadMe;
  }
  async getComponentInfos() {
    const demosPath = path.join(this.readmeAssetsFolderPath, 'demos');
    const allDemoFolderNames = await fs.readdir(demosPath);
    return await Promise.all(allDemoFolderNames.map(async (demoFolderName) => {
      const demoFolderPath = path.join(demosPath, demoFolderName);
      const readme = await this.readComponentReadMe(demoFolderPath);
      const codeDetails = await this.readDemoCode(demoFolderPath);
      const demo: Demo = {
        codeDetails,
        readme,
        name: demoFolderName,
        folderPath: demoFolderPath
      };
      return demo;
    }));
  }
}
