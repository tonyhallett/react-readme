import { IAssetManagerOptions, ComponentOptionsCommon, GlobalComponentOptions } from "./AssetManager";
import { LaunchOptions } from 'puppeteer';
import { ISystem } from "../interfaces";
import { IGlobalOptionsProvider } from "./IOptionsProvider";


export type GlobalRootOptions =(ComponentOptionsCommon & {readmeAssetsFolderPath?:string}&{puppeteerLaunchOptions?:LaunchOptions})|undefined

export class AssetManagerOptions implements IAssetManagerOptions {
  private options:GlobalRootOptions;
  puppeteerLaunchOptions:LaunchOptions|undefined
  readmeAssetsFolderPath!: string;
  globalComponentOptions: GlobalComponentOptions;
  constructor(private readonly system:ISystem,private readonly optionsProvider:IGlobalOptionsProvider){}
  
  private fallbackDefaultReadmeAssetsFolderName():void{
    if(!this.readmeAssetsFolderPath){
      this.readmeAssetsFolderPath = this.system.path.absoluteOrCwdJoin('README-assets');
    }
  }
  private async setOptionsAndReadmeAssetsFolderPath():Promise<void>{
    const globalOptions = await this.optionsProvider.getOptions(this.system.cwd);
    if(globalOptions){
      this.options = globalOptions;
      if(globalOptions.readmeAssetsFolderPath){
        this.readmeAssetsFolderPath=this.system.path.absoluteOrCwdJoin(globalOptions.readmeAssetsFolderPath);
      }
    }else{
      this.fallbackDefaultReadmeAssetsFolderName();
      this.options = await this.optionsProvider.getOptions(this.readmeAssetsFolderPath)
    }
    this.fallbackDefaultReadmeAssetsFolderName();
  }
  
  async init():Promise<void>{
    await this.setOptionsAndReadmeAssetsFolderPath();
    if(this.options){
      this.puppeteerLaunchOptions = this.options.puppeteerLaunchOptions;
      const {puppeteerLaunchOptions,readmeAssetsFolderPath,...other} = this.options; 
      this.globalComponentOptions = other;
    }
  }
  
}
