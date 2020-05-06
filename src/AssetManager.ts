import { IAssetManager, CodeDetails, ComponentInfo, ISystem } from './interfaces';
import { IRequirer } from './interfaces';
import { ComponentScreenshotOptions, ScreenshotType } from './PuppeteerImageGenerator';
import puppeteer from 'puppeteer';
import { IReactReadme } from './interfaces';
import { pathExists } from 'fs-extra';

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
interface IAssetFolderComponentInfoProvider<T extends GlobalComponentOptions=any>{
  getComponentInfos(componentAssetsFolder: string, globalOptions: T): Promise<ComponentInfo[]>
}
export interface SortedComponentFolder{componentFolderName:string,parsedName:string}
export interface IComponentSorter{
  sort(componentFolderNames:string[]):Array<SortedComponentFolder>
}

type FolderOptions = ComponentOptions&{componentPath?:string};
export class AssetFolderProvider implements IAssetFolderProvider{
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
  private providers:IAssetFolderComponentInfoProvider[] = [];
  constructor(
    private readonly system:ISystem,
    private readonly requirer:IRequirer, 
    private readonly reactReadMe:IReactReadme,
    private readonly componentSorter:IComponentSorter
    ){}
  registerAssetFolderProviders(...providers:IAssetFolderComponentInfoProvider[]){
    this.providers = providers;
  }
  private async hasProps(componentAssetFolder:string):Promise<boolean>{
    return await this.system.path.exists(
      this.system.path.join(componentAssetFolder,'props.js')
    ) ||
     await this.system.path.exists(
      this.system.path.join(componentAssetFolder,'props')
    )
  }
  private generateComponentInfosForProps(componentAssetFolder:string,folderOptions:FolderOptions):Promise<ComponentInfo[]>{
    throw new Error();
  }
  private async getFolderOptions(componentAssetFolder:string):Promise<FolderOptions|undefined>{
    if(await this.reactReadMe.exists(componentAssetFolder)){
      return this.reactReadMe.read<FolderOptions>(componentAssetFolder)
    }
    return Promise.resolve(undefined);
  }
  private async getMergedOptions(componentAssetFolderPath:string):Promise<FolderOptions>{
    const folderOptions = await this.getFolderOptions(componentAssetFolderPath);
    // todo - for a moment
    return {...this.globalOptions,...(folderOptions?folderOptions:{})}
  }
  //not doing module resolution yet - so they must have file path
  private getAbsolutePathToJs(componentAssetFolderPath:string,jsPath:string):string{
    if(this.system.path.isAbsolute(jsPath)){
      return jsPath;
    }
    return this.system.path.join(componentAssetFolderPath,jsPath);
  }
  private async getComponentInfosForFolder(componentAssetFolderPath:string, componentAssetFolderName:string):Promise<ComponentInfo[]>{
    const mergedFolderOptions = await this.getMergedOptions(componentAssetFolderPath);
    if(await this.hasProps(componentAssetFolderPath)){
      return this.generateComponentInfosForProps(componentAssetFolderPath,mergedFolderOptions);
    }
    const readme = await this.readComponentReadMe(componentAssetFolderPath);

    // Current readme code is not looking for specific export.... 
    const componentPath = mergedFolderOptions && mergedFolderOptions.componentPath ? this.getAbsolutePathToJs(componentAssetFolderPath,mergedFolderOptions.componentPath) :
      this.system.path.join(componentAssetFolderPath,'index.js');
    const codeDetails = await this.getDemoCode(componentPath,mergedFolderOptions.codeInReadme,mergedFolderOptions.codeReplacer);
    const componentScreenshot = this.getComponentScreenshot(componentPath,mergedFolderOptions.screenshotOptions);
    
    const componentInfo: ComponentInfo = {
      codeDetails,
      readme,
      name: componentAssetFolderName,
      componentScreenshot
    };
    return [componentInfo];

  }
  private async getOwnComponentInfos():Promise<ComponentInfo[][]>{
    const componentAssetFolderNames = await this.system.fs.readdir(this.componentAssetsFolder);
    const orderedComponentAssetFolderNames  = this.componentSorter.sort(componentAssetFolderNames);
    return await Promise.all(orderedComponentAssetFolderNames.map(async (orderedComponentAssetFolderName) => {
      const componentAssetFolder = this.system.path.join(this.componentAssetsFolder, orderedComponentAssetFolderName.componentFolderName);
      return this.getComponentInfosForFolder(componentAssetFolder,orderedComponentAssetFolderName.parsedName);
    }));
  }
    
  private joinComponentInfos(allComponentInfos:ComponentInfo[][]){
    let componentInfos:ComponentInfo[] = [];
    allComponentInfos.forEach(folderComponentInfos => {
      componentInfos = componentInfos.concat(folderComponentInfos);
    })
    return componentInfos;
  }
  private globalOptions!: GlobalComponentOptions
  private componentAssetsFolder!: string
  async getComponentInfos(componentAssetsFolder: string, globalOptions: GlobalComponentOptions): Promise<ComponentInfo[]> {
      const providersInfos = await Promise.all(this.providers.map(provider => {
        return provider.getComponentInfos(componentAssetsFolder, globalOptions);
      }));
      this.componentAssetsFolder = componentAssetsFolder;
      this.globalOptions = globalOptions;
      const ownInfos = await this.getOwnComponentInfos();
      return this.joinComponentInfos(providersInfos.concat(ownInfos));
      // definitely want to allow a path for the Component !

      // could have componentOptions allow props[]
      // method for getting props into the demo code - but how do you get the string !
      // you could have structure
      /*
        Component1
          react-readme.js
            {
              todo - altText ?

              componentPath?:string
              componentExportProperty?:string

              codeReplacer:(code:string)=>string, - Could this be used to inject ? 
                only the js version
              codeInReadme?:'None'|'Js',     **** need a new Props setting or propsInReadme



              screenshotOptions?:
                css?:string,
                webfont?:any,
                width?:number,
                height?:number,
                type?:'jpeg'|'png'

                props?:P,  ************************  odd for this to be global
                 if make props an array - we auto generate more componentInfos
                  ************************
                  String method find props and then parse ? - is an arse

            }
          readMe.md ( suppose could have an array) - you could mention props but not as good as generation
          
          props1.js, props2.js, props3.js - or a single props which exports an array then different format for that
          ( which will have a ts version that can inject in the code)
            If doing typescript will import the component props. - perhaps then codeReplacer hint

            But what if want different screenshot options ?
            What if wanted own readme soley for the props

            Props
              Props1
                props
                README.md
                react-readme.js

          It would be a lot easier to ignore props and to just wrap for each props combination
                



          ---
      */

      
    
  }
  private async readDemoCode(componentPath: string,javascript:boolean): Promise<CodeDetails> {
    const languageLookup = javascript ? [this.languageLookup[2]] : this.languageLookup;
    const prefix = componentPath.substr(0,componentPath.length-3);

    const { didRead, read, readPath } = await this.system.fs.readUntilExists(...languageLookup.map(entry => `${prefix}${entry.extension}`));
    if (!didRead) {
      throw new Error('no component file found');
    }
    return {
      code: read,
      language: languageLookup.find(entry => entry.extension === this.system.path.extname(readPath!))!.language
    };
  }
  private getCodeReplacer(codeReplacer: CodeReplacer|undefined){
    let replacer:(code:string)=>string
    if(codeReplacer ===undefined){
      replacer = code => code;
    }else{
      if(typeof codeReplacer === 'function'){
        replacer = codeReplacer
      }else{
        replacer = code => code.replace(codeReplacer.regex, codeReplacer.replace);
      }
    }
    return replacer;
  }
  async getDemoCode(componentPath: string, codeInReadme: "None" | "Js" | undefined, codeReplacer: CodeReplacer|undefined): Promise<CodeDetails> {
    if(codeInReadme==='None'){
      const noCodeDetails:CodeDetails={
        code:'',
        language:''
      }
      return Promise.resolve(noCodeDetails)
    }
    
    const {code, language} = await this.readDemoCode(componentPath,codeInReadme==='Js');

    return {
      code:this.getCodeReplacer(codeReplacer)(code),
      language
    }
  }
  getComponentScreenshot(componentPath: string, screenshotOptions: ReadmeComponentScreenshotOptions | undefined, exportProperty='default'): Pick<import("./PuppeteerImageGenerator").Options<{}>, "css" | "webfont" | "type" | "width" | "height" | "props"> & { type?: "jpeg" | "png" | undefined; } & { Component: import("react").ComponentType<{}>; } {
    const Component = this.requirer.require(componentPath)[exportProperty];
    return {
      Component,
      ...screenshotOptions

    }
  }
  async readComponentReadMe(componentAssetFolder: string): Promise<string> {
    const readmePath = this.system.path.join(componentAssetFolder, 'README.md');
    const exists = await this.system.path.exists(readmePath);
    let componentReadMe = '';
    if (exists) {
      componentReadMe = await this.system.fs.readFileString(readmePath);
    }
    return componentReadMe;
  }

}
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
  registerComponentInfoProviders(...componentInfoProviders:ComponentInfoProvider<any>[]){
    this.componentInfoProviders = componentInfoProviders;
  }
  
  private pathInReadmeAssetsFolder(path: string) {
    return this.system.path.join(this.readmeAssetsFolderPath,path);
  }
  
  async cleanComponentImages() {
    await this.system.fs.emptyDir(this.componentImagesFolderPath);
  }
  getComponentImagePath(...parts: string[]): string {
    return this.system.path.join(...([this.componentImagesFolderPath].concat(parts)));
  }
  async readSurroundingReadme(isPre: boolean) {
    const readmePaths: string[] = isPre ? ['README.md', 'READMEPre.md'] : ['READMEPost.md'];
    const { read } = await this.system.fs.readUntilExists(...readmePaths.map(readmeName => this.pathInReadmeAssetsFolder(readmeName)));
    return read;
  }
  async getComponentInfos():Promise<ComponentInfo[]> {
    
    let componentInfos = await this.getAssetFolderComponentInfos();
    for(const componentInfoProvider of this.componentInfoProviders){
      componentInfos = componentInfos.concat(await componentInfoProvider.getComponentInfos(this.readmeAssetsFolderPath,this.options.globalComponentOptions));
    }
    return componentInfos;
  }
  private getAssetFolderComponentInfos(){
    //this could be an option
    const componentAssetsFolder = this.pathInReadmeAssetsFolder('components');
    return this.assetFolderProvider.getComponentInfos(componentAssetsFolder,this.options.globalComponentOptions);
  }
}
