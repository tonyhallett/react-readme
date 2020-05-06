import { IAssetManagerOptions, ComponentOptions } from "./AssetManager";
import { LaunchOptions } from 'puppeteer';
import { ISystem, IReactReadme } from "./interfaces";


type GlobalOptions = Partial<ComponentOptions>&{puppeteerLaunchOptions:LaunchOptions};
type GlobalRootOptions = GlobalOptions & {readmeAssetsFolderPath?:string}

export class AssetManagerOptions implements IAssetManagerOptions {
  puppeteerLaunchOptions:LaunchOptions|undefined
  readmeAssetsFolderPath!: string;
  constructor(private readonly system:ISystem,private readonly reactReadme:IReactReadme){}
  globalComponentOptions: Partial<ComponentOptions>|undefined;
  private options:GlobalRootOptions|undefined;
  
  async init(){
    await this.setOptionsAndReadmeAssetsFolderPath();
    if(this.options){
      this.puppeteerLaunchOptions = this.options.puppeteerLaunchOptions;
      const {puppeteerLaunchOptions,readmeAssetsFolderPath,...other} = this.options; 
      this.globalComponentOptions = other;
    }
  }
  private fallbackDefaultReadmeAssetsFolderName(){
    if(!this.readmeAssetsFolderPath){
      this.readmeAssetsFolderPath = this.system.path.absoluteOrCwdRelative('README-assets');
    }
  }
  private async setOptionsAndReadmeAssetsFolderPath():Promise<void>{
    if(await this.reactReadme.exists(this.system.cwd)){
      const globalRootOptions = await this.reactReadme.read<GlobalRootOptions>(this.system.cwd);
      this.options = globalRootOptions;
      if(globalRootOptions.readmeAssetsFolderPath){
        this.readmeAssetsFolderPath=this.system.path.absoluteOrCwdRelative(globalRootOptions.readmeAssetsFolderPath);
      }
    }else{
      this.fallbackDefaultReadmeAssetsFolderName();
      if(await this.reactReadme.exists(this.readmeAssetsFolderPath)){
        this.options = await this.reactReadme.read<GlobalOptions>(this.readmeAssetsFolderPath);
      }
    }
    this.fallbackDefaultReadmeAssetsFolderName();
  }
}
