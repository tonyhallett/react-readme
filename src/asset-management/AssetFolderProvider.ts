import { CodeDetails, ComponentInfo, ISystem , IRequirer} from '../interfaces';
import { IAssetFolderProvider, ComponentOptions, GlobalComponentOptions, CodeReplacer, CodeInReadme, ComponentOptionsCommon, ComponentOptionsProps, PropsOptions } from './AssetManager';
import { ILanguageReader } from './LanguageReader';
export interface IAssetFolderComponentInfoProvider<T=any>{
  getComponentInfos(componentAssetsFolder: string, globalOptions: T&GlobalComponentOptions): Promise<ComponentInfo[]>
}

export interface SortedComponentFolder{componentFolderName:string,parsedName:string}
export interface IComponentSorter{
  sort(componentFolderNames:string[]):Array<SortedComponentFolder>
}

export interface IComponentFolderOptionsProvider{
  getPropsCode(componentAssetFolderPath: string,isJs:boolean): Promise<CodeDetails>;
  getComponentCode(componentAssetFolderPath: string,isJs:boolean): Promise<CodeDetails>;
  getOptions(componentFolderPath:string):Promise<ComponentOptions|undefined>
}

type CodeProvider = (isJs:boolean)=>Promise<CodeDetails>

type ComponentComponentInfo = Pick<ComponentInfo,'readme'|'codeDetails'>&{Component:React.ComponentType};

export class AssetFolderProvider implements IAssetFolderProvider {
  private providers: IAssetFolderComponentInfoProvider[] = [];
  private globalOptions!: GlobalComponentOptions;
  private componentAssetsFolder!: string;
  constructor(
    private readonly system: ISystem, 
    private readonly requirer: IRequirer, 
    private readonly componentFolderOptionsProvider: IComponentFolderOptionsProvider, 
    private readonly componentSorter: IComponentSorter,
    private readonly languageReader: ILanguageReader
    ) 
    {
    
  }
  
  private async generateComponentInfosForProps(componentOptions:ComponentOptions&{props:ComponentOptionsProps},mergedOptions: ComponentOptionsCommon,componentAssetFolder: string,componentAssetFolderName:string): Promise<ComponentInfo[]> {
    const {Component,codeDetails, readme} = await this.getComponentComponentInfo(componentOptions,mergedOptions,componentAssetFolder);
    const componentComponentInfo:ComponentInfo = {
      readme,codeDetails,name:''
    }
    const componentInfos =  await Promise.all(componentOptions.props.map(async (propsOrPropsAndOptions,i) => {
      let props = propsOrPropsAndOptions;
      let propsOptions:PropsOptions = {};
      if(Array.isArray(propsOrPropsAndOptions)){
        props = propsOrPropsAndOptions[0];
        propsOptions = propsOrPropsAndOptions[1];
      }
      let propsCodeDetails:CodeDetails|undefined;
      if(mergedOptions.propsCodeInReadme!=='None'){
        propsCodeDetails = await this.componentFolderOptionsProvider.getPropsCode(componentAssetFolder,mergedOptions.propsCodeInReadme==='Js')
      }
      let propsReadme = propsOptions.readme;
      if(propsOptions.readmeFileName){
        propsReadme = await this.readComponentReadMe(propsOptions.readmeFileName);
      }
      const screenshotOptions = propsOptions.screenshotOptions||mergedOptions.screenshotOptions;
      const propsComponentInfo:ComponentInfo = {
        codeDetails:propsCodeDetails,
        readme:propsReadme,
        name:`${componentAssetFolderName}props{i}`,
        componentScreenshot:{
          Component,
          props,
          ...screenshotOptions
        },
      };

      return propsComponentInfo;
    }));
    return [componentComponentInfo].concat(componentInfos);
  }
  
  private getMergedOptions(componentOptions:ComponentOptions|undefined) {
    return { ...this.globalOptions, ...componentOptions };
  }
  private getAbsolutePathToJs(componentAssetFolderPath: string, jsPath: string): string {
    if (this.system.path.isAbsolute(jsPath)) {
      return jsPath;
    }
    return this.system.path.join(componentAssetFolderPath, jsPath);
  }
  private async getComponentComponentInfo(
    componentOptions:ComponentOptions|undefined,
    mergedOptions:ComponentOptionsCommon,
    componentAssetFolderPath:string,
    ):Promise<ComponentComponentInfo>{
    const readme = await this.readComponentReadMe(componentAssetFolderPath);

    const componentPath = componentOptions && componentOptions.componentPath ? this.getAbsolutePathToJs(componentAssetFolderPath, componentOptions.componentPath) :
      this.system.path.join(componentAssetFolderPath, 'index.js');
    
    let codeProvider!:CodeProvider;
    if(componentOptions && componentOptions.component&&componentOptions.componentPath===undefined){
      codeProvider = (isJs) => this.componentFolderOptionsProvider.getComponentCode(componentAssetFolderPath,isJs);
    }else{
      codeProvider = (isJs) => this.readComponentCode(componentPath,isJs);
    }
    const codeDetails = await this.getComponentCode(codeProvider, mergedOptions.codeInReadme,mergedOptions.codeReplacer)
    
    let Component = componentOptions?.component||this.getComponentByPath(componentPath, componentOptions?.componentKey);

    return {
      codeDetails,
      Component,
      readme
    }
  }
  private async getComponentInfosForFolder(componentAssetFolderPath: string, componentAssetFolderName: string): Promise<ComponentInfo[]> {
    const componentOptions = await this.componentFolderOptionsProvider.getOptions(componentAssetFolderPath);
    const mergedOptions = this.getMergedOptions(componentOptions);

    if (componentOptions && componentOptions.props && componentOptions.props.length>0) {
      return this.generateComponentInfosForProps(componentOptions as any,mergedOptions,componentAssetFolderPath,componentAssetFolderName);
    }
    
    const {Component,...others} = await this.getComponentComponentInfo(componentOptions,mergedOptions,componentAssetFolderPath);
    const componentInfo: ComponentInfo = {
      ...others,
      name:componentAssetFolderName,
      componentScreenshot:{
        Component,
        ...mergedOptions.screenshotOptions
      }
    };
    return [componentInfo];
  }
  private async getOwnComponentInfos(): Promise<ComponentInfo[][]> {
    const componentAssetFolderNames = await this.system.fs.readdir(this.componentAssetsFolder);
    const orderedComponentAssetFolderNames = this.componentSorter.sort(componentAssetFolderNames);
    return await Promise.all(orderedComponentAssetFolderNames.map(async (orderedComponentAssetFolderName) => {
      const componentAssetFolder = this.system.path.join(this.componentAssetsFolder, orderedComponentAssetFolderName.componentFolderName);
      return this.getComponentInfosForFolder(componentAssetFolder, orderedComponentAssetFolderName.parsedName);
    }));
  }
  private joinComponentInfos(allComponentInfos: ComponentInfo[][]):ComponentInfo[]{
    let componentInfos: ComponentInfo[] = [];
    allComponentInfos.forEach(folderComponentInfos => {
      componentInfos = componentInfos.concat(folderComponentInfos);
    });
    return componentInfos;
  }
  private async readComponentCode(componentPath: string, javascript: boolean): Promise<CodeDetails> {
    const result = await this.languageReader.read(componentPath,javascript);
    if(result){
      return {
        code:result.code,
        language:result.language
      };
    }else{
      throw new Error('no component file found');
    }
  }
  private getCodeReplacer(codeReplacer: CodeReplacer | undefined):(code:string)=>string {
    let replacer: (code: string) => string;
    if (codeReplacer === undefined) {
      replacer = code => code;
    }
    else {
      if (typeof codeReplacer === 'function') {
        replacer = codeReplacer;
      }
      else {
        replacer = code => code.replace(codeReplacer.regex, codeReplacer.replace);
      }
    }
    return replacer;
  }
  
  async getComponentInfos(componentAssetsFolder: string, globalOptions: GlobalComponentOptions): Promise<ComponentInfo[]> {
    const providersInfos = await Promise.all(this.providers.map(provider => {
      return provider.getComponentInfos(componentAssetsFolder, globalOptions);
    }));
    this.componentAssetsFolder = componentAssetsFolder;
    this.globalOptions = globalOptions;
    const ownInfos = await this.getOwnComponentInfos();
    return this.joinComponentInfos(providersInfos.concat(ownInfos));
  }
  registerAssetFolderProviders(...providers: IAssetFolderComponentInfoProvider[]):void {
    this.providers = providers;
  }
  
  async getComponentCode(codeProvider:(isJs:boolean)=>Promise<CodeDetails>, codeInReadme: CodeInReadme| undefined, codeReplacer: CodeReplacer | undefined): Promise<CodeDetails> {
    if (codeInReadme === 'None') {
      const noCodeDetails: CodeDetails = {
        code: '',
        language: ''
      };
      return Promise.resolve(noCodeDetails);
    }
    
    const { code, language } = await codeProvider(codeInReadme === 'Js');

    return {
      code: this.getCodeReplacer(codeReplacer)(code),
      language
    };
  }
  getComponentByPath(componentPath: string, key:string|undefined): React.ComponentType {
    let Component:React.ComponentType|undefined
    const required = this.requirer.require(componentPath);
    if(required){
      if(key===undefined && required.default){
        Component = required.default;
      }
      if(Component===undefined){
        Component = key? required[key]:required;
      }
    }
    
    if(Component===undefined){
      throw new Error('Cannot find component at path: ' + componentPath);
    }
    return Component;
  }
  async readComponentReadMe(componentAssetFolder: string,readmeName='README.md'): Promise<string> {
    const readmePath = this.system.path.join(componentAssetFolder, 'README.md');
    const exists = await this.system.path.exists(readmePath);
    let componentReadMe = '';
    if (exists) {
      componentReadMe = await this.system.fs.readFileString(readmePath);
    }
    return componentReadMe;
  }
}
