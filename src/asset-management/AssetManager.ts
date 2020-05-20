import { IAssetManager, ComponentInfo, ISystem, ReadmeImageType } from '../interfaces';
import { ComponentScreenshotOptions } from '../PuppeteerImageGenerator';
import puppeteer from 'puppeteer';

export type CodeReplacer = {
  regex:RegExp,
  replace:string
}|((code:string)=>string)


export type ReadmeComponentScreenshotOptions=ComponentScreenshotOptions&{type?:ReadmeImageType}

export type CodeInReadme = 'None'|'Js'

export interface ComponentOptionsCommon{
  codeReplacer?:CodeReplacer,
  codeInReadme?:CodeInReadme,
  propsCodeInReadme?:CodeInReadme,
  screenshotOptions?:ReadmeComponentScreenshotOptions
}
export type ComponentOptionsNoId = Omit<ComponentOptionsCommon,'id'>;

export type GlobalComponentOptions = ComponentOptionsCommon&{altTextFromFolderName?:boolean}|undefined

export interface FirstLastSeparators{
  first?:string,
  last?:string
}
export interface ComponentInfoSeparators{
  componentSeparator?:string,
  componentPropsSeparator?:string,
  propSeparator?:string
}
export type Separators = FirstLastSeparators & ComponentInfoSeparators;

export interface IAssetManagerOptions{
  readmeAssetsFolderPath:string,
  puppeteerLaunchOptions:puppeteer.LaunchOptions|undefined,
  globalComponentOptions:GlobalComponentOptions,
  imageBeforeCode?:boolean
  separators?:Separators
}

export interface IAssetFolderProvider{
  getComponentInfos(componentAssetsFolder:string,globalOptions:GlobalComponentOptions,separators:ComponentInfoSeparators|undefined):Promise<ComponentInfo[]>

}

export interface PropsOptions{
  readme?:string,
  readmeFileName?:string,
  altText?:string,
  screenshotOptions?:ReadmeComponentScreenshotOptions
}
export type Props = Record<string,any>
export type PropsWithOptions = [Props,PropsOptions]
export type PropsOrPropsWithOptions = Props|PropsWithOptions
export type ComponentOptionsProps = Array<PropsOrPropsWithOptions>
export type ComponentOptions = ComponentOptionsCommon & 
  {
    componentPath?:string,
    component?:React.ComponentType,
    componentKey?:string,
    props?:ComponentOptionsProps,
    altText?:string
  }
export interface ComponentInfoProvider<T={}>{
  getComponentInfos(readmeAssetsFolderPath:string,globalOptions:T&GlobalComponentOptions):Promise<ComponentInfo[]>
}

export class AssetManager implements IAssetManager {
  private readmeAssetsFolderPath!: string;
  private componentImagesFolderPath!: string;
  private componentInfoProviders:ComponentInfoProvider<any>[] = [];
  puppeteerLaunchOptions:puppeteer.LaunchOptions|undefined;
  imageBeforeCode:boolean
  constructor(
    private readonly options:IAssetManagerOptions,
    
    private readonly assetFolderProvider:IAssetFolderProvider,

    private readonly system:ISystem){
    
      this.readmeAssetsFolderPath = options.readmeAssetsFolderPath;
      // could have this as an option 
      this.componentImagesFolderPath = this.pathInReadmeAssetsFolder('images'); 
      this.puppeteerLaunchOptions = options.puppeteerLaunchOptions;
      this.imageBeforeCode = options.imageBeforeCode===undefined?true:options.imageBeforeCode;
  }
  
  private pathInReadmeAssetsFolder(path: string):string {
    return this.system.path.join(this.readmeAssetsFolderPath,path);
  }
  private getAssetFolderComponentInfos():Promise<ComponentInfo[]>{
    // this could be an option
    const componentAssetsFolder = this.pathInReadmeAssetsFolder('components');
    return this.assetFolderProvider.getComponentInfos(componentAssetsFolder,this.options.globalComponentOptions,this.options.separators);
  }
  
  async cleanComponentImages():Promise<void> {
    return this.system.fs.emptyDir(this.componentImagesFolderPath);
  }
  getComponentImagePath(...parts: string[]): string {
    return this.system.path.join(...([this.componentImagesFolderPath].concat(parts)));
  }
  async readSurroundingReadme(isPre: boolean):Promise<string|undefined> {
    const readmePaths: string[] = isPre ? ['README.md', 'READMEPre.md'] : ['READMEPost.md'];
    let { read } = await this.system.fs.readUntilExists(...readmePaths.map(readmeName => this.pathInReadmeAssetsFolder(readmeName)));
    if(read){
      if(isPre){
        if(this.options.separators?.first){
          read=read+=this.options.separators.first;
        }
      }else{
        if(this.options.separators?.last){
          read=this.options.separators.last + read;
        }
      }

    }
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
  registerComponentInfoProviders(...componentInfoProviders:ComponentInfoProvider<any>[]):void{
    this.componentInfoProviders = componentInfoProviders;
  }
  
}
