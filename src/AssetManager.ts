import { IAssetManager, ComponentInfo, ISystem } from './interfaces';
import { ComponentScreenshotOptions, ScreenshotType } from './PuppeteerImageGenerator';
import puppeteer from 'puppeteer';

export type CodeReplacer = {
  regex:RegExp,
  replace:string
}|((code:string)=>string)

export type ReadmeImageType = Exclude<ScreenshotType,'pdf'>

export type ReadmeComponentScreenshotOptions=ComponentScreenshotOptions&{type?:ReadmeImageType}

export interface ComponentOptions{
  codeReplacer?:CodeReplacer,
  codeInReadme?:'None'|'Js',
  screenshotOptions?:ReadmeComponentScreenshotOptions
}
export type ComponentOptionsNoId = Omit<ComponentOptions,'id'>;

export type GlobalComponentOptions = Partial<ComponentOptions>|undefined

export interface IAssetManagerOptions{
  readmeAssetsFolderPath:string,
  puppeteerLaunchOptions:puppeteer.LaunchOptions|undefined,
  globalComponentOptions:GlobalComponentOptions
}

export interface IAssetFolderProvider{
  getComponentInfos(componentAssetsFolder:string,globalOptions:GlobalComponentOptions):Promise<ComponentInfo[]>

}



export type FolderOptions = ComponentOptions&{componentPath?:string};
export interface ComponentInfoProvider<T={}>{
  getComponentInfos(readmeAssetsFolderPath:string,globalOptions:T&GlobalComponentOptions):Promise<ComponentInfo[]>
}

export class AssetManager implements IAssetManager {
  private readmeAssetsFolderPath!: string;
  
  
  private componentImagesFolderPath!: string;
  puppeteerLaunchOptions:puppeteer.LaunchOptions|undefined;
  constructor(
    private readonly options:IAssetManagerOptions,
    
    private readonly assetFolderProvider:IAssetFolderProvider,

    private readonly system:ISystem){
    
      this.readmeAssetsFolderPath = options.readmeAssetsFolderPath;
      // could have this as an option 
      this.componentImagesFolderPath = this.pathInReadmeAssetsFolder('images'); 
      this.puppeteerLaunchOptions = options.puppeteerLaunchOptions;
  }
  private componentInfoProviders:ComponentInfoProvider<any>[] = [];
  registerComponentInfoProviders(...componentInfoProviders:ComponentInfoProvider<any>[]):void{
    this.componentInfoProviders = componentInfoProviders;
  }
  
  private pathInReadmeAssetsFolder(path: string):string {
    return this.system.path.join(this.readmeAssetsFolderPath,path);
  }
  
  async cleanComponentImages():Promise<void> {
    return this.system.fs.emptyDir(this.componentImagesFolderPath);
  }
  getComponentImagePath(...parts: string[]): string {
    return this.system.path.join(...([this.componentImagesFolderPath].concat(parts)));
  }
  async readSurroundingReadme(isPre: boolean):Promise<string|undefined> {
    const readmePaths: string[] = isPre ? ['README.md', 'READMEPre.md'] : ['READMEPost.md'];
    const { read } = await this.system.fs.readUntilExists(...readmePaths.map(readmeName => this.pathInReadmeAssetsFolder(readmeName)));
    return read;
  }
  async getComponentInfos():Promise<ComponentInfo[]> {
    let componentInfos = await this.getAssetFolderComponentInfos();
    for(const componentInfoProvider of this.componentInfoProviders){
      componentInfos = componentInfos.concat(
        await componentInfoProvider.getComponentInfos(this.readmeAssetsFolderPath,this.options.globalComponentOptions)
      );
    }
    return componentInfos;
  }
  private getAssetFolderComponentInfos():Promise<ComponentInfo[]>{
    //this could be an option
    const componentAssetsFolder = this.pathInReadmeAssetsFolder('components');
    return this.assetFolderProvider.getComponentInfos(componentAssetsFolder,this.options.globalComponentOptions);
  }
}
