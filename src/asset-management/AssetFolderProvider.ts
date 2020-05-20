import { CodeDetails, ComponentInfo, ISystem , IRequirer} from '../interfaces';
import { IAssetFolderProvider, ComponentOptions, GlobalComponentOptions, CodeReplacer, CodeInReadme, ComponentOptionsCommon, ComponentOptionsProps, PropsOptions, PropsOrPropsWithOptions, Props, ComponentInfoSeparators } from './AssetManager';
import { ILanguageReader } from './LanguageReader';
export interface IAssetFolderComponentInfoProvider<T=any>{
  getComponentInfos(componentAssetsFolder: string, globalOptions: T&GlobalComponentOptions): Promise<ComponentInfo[]>
}

export interface SortedComponentFolder{componentFolderName:string,parsedName:string}
export interface IComponentSorter{
  sort(componentFolderNames:string[]):Array<SortedComponentFolder>
}

export interface PropsCodeDetails{
  code:string[],
  language:string
}
export interface IComponentFolderOptionsProvider{
  getPropsCode(componentAssetFolderPath: string,isJs:boolean): Promise<PropsCodeDetails>;
  getComponentCode(componentAssetFolderPath: string,isJs:boolean): Promise<CodeDetails>;
  getOptions(componentFolderPath:string):Promise<ComponentOptions|undefined>
}

type CodeProvider = (isJs:boolean)=>Promise<CodeDetails>

export type ComponentComponentInfo = Pick<ComponentInfo,'readme'|'codeDetails'>&{Component:React.ComponentType};
export type PropsAndOptions = {
  props:Props,
  propsOptions:PropsOptions
}
export type ComponentOptionsWithProps = ComponentOptions&{props:ComponentOptionsProps};
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
  
  private getPropsAndOptions(propsOrPropsWithOptions:PropsOrPropsWithOptions):PropsAndOptions{
    let props = propsOrPropsWithOptions;
    let propsOptions:PropsOptions = {};
    if(Array.isArray(propsOrPropsWithOptions)){
      props = propsOrPropsWithOptions[0];
      propsOptions = propsOrPropsWithOptions[1];
    }
    return {props,propsOptions};
  }
  private async getPropsCodeDetails(mergedOptions:ComponentOptionsCommon,componentAssetFolder:string){
    let propsCodeDetails:PropsCodeDetails|undefined;
    if(mergedOptions.propsCodeInReadme!=='None'){
      propsCodeDetails = await this.componentFolderOptionsProvider.getPropsCode(componentAssetFolder,mergedOptions.propsCodeInReadme==='Js');
      if(propsCodeDetails===undefined){
        throw new Error('Unable to parse props for readme code');
      }
    }
    return propsCodeDetails!;
  }
  private async getPropsReadme(propsOptions:PropsOptions,componentAssetFolder:string){
    let propsReadme = propsOptions.readme;
    if(propsOptions.readmeFileName){
      propsReadme = await this.readReadMe(componentAssetFolder,propsOptions.readmeFileName,true);
    }
    return propsReadme;
  }
  
  private async generateComponentInfosForAllProps(
    componentOptions:ComponentOptionsWithProps,
    mergedOptions: ComponentOptionsCommon,
    componentAssetFolder: string,
    componentAssetFolderName:string,
    isFirst:boolean,
    separators:ComponentInfoSeparators|undefined
    ): Promise<ComponentInfo[]> {
    const {Component,codeDetails, readme} = await this.getComponentComponentInfo(componentOptions,mergedOptions,componentAssetFolder);
    const separatedReadme = this.getComponentSeparatedReadme(readme,isFirst,separators?.componentPropsSeparator||separators?.componentSeparator);
    const componentComponentInfo:ComponentInfo = {
      readme:separatedReadme,codeDetails,name:''
    }
    
    let propsCodeDetails = await this.getPropsCodeDetails(mergedOptions,componentAssetFolder);
    const componentInfos =  await Promise.all(componentOptions.props.map(async (propsOrPropsWithOptions,i) => {
      const {props,propsOptions} = this.getPropsAndOptions(propsOrPropsWithOptions);
      
      let propsReadme = await this.getPropsReadme(propsOptions,componentAssetFolder);
      const separatedReadme = this.getSeparatedReadme(propsReadme,separators?.propSeparator||separators?.componentPropsSeparator||separators?.componentSeparator);
      const screenshotOptions = propsOptions.screenshotOptions||mergedOptions.screenshotOptions;
      const propsComponentInfo:ComponentInfo = {
        codeDetails:{
          code:propsCodeDetails.code[i],
          language:propsCodeDetails.language
        },
        readme:separatedReadme,
        name:`${componentAssetFolderName}-props-${i}`,
        altText:propsOptions.altText,
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
    let globalComponentCommonOptions:ComponentOptionsCommon = {};
    if(this.globalOptions){
      const {altTextFromFolderName,...others} = this.globalOptions;
      globalComponentCommonOptions = others;
    }
    let componentOptionsCommon: ComponentOptionsCommon  = {}
    if(componentOptions){
      const {altText,component,componentKey,componentPath,props, ...others} = componentOptions;
      componentOptionsCommon = others;
    }
    return {...globalComponentCommonOptions,...componentOptionsCommon};
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
    const readme = await this.readReadMe(componentAssetFolderPath);

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
  private getComponentAltText(componentOptions:ComponentOptions|undefined,componentAssetFolderName:string){
    if(componentOptions?.altText){
      return componentOptions.altText;
    }
    if(this.globalOptions?.altTextFromFolderName){
      return componentAssetFolderName;
    }
  }
  private getSeparatedReadme(readme:string|undefined,separator:string|undefined){
    let separatedReadme:string|undefined;
    if(separator){
      if(readme){
        separatedReadme = separator + readme;
      }else{
        separatedReadme = separator
      }
    }else{
      separatedReadme = readme;
    }
    return separatedReadme;
  }
  private getComponentSeparatedReadme(readme:string|undefined,isFirst:boolean,componentSeparator:string|undefined){
    let separatedReadme:string|undefined;
    if(!isFirst){
      separatedReadme = this.getSeparatedReadme(readme,componentSeparator);
    }else{
      separatedReadme = readme;
    }
    return separatedReadme;
  }
  private async getComponentInfosForFolder(componentAssetFolderPath: string, componentAssetFolderName: string,isFirst:boolean,separators:ComponentInfoSeparators|undefined): Promise<ComponentInfo[]> {
    const componentOptions = await this.componentFolderOptionsProvider.getOptions(componentAssetFolderPath);
    const mergedOptions = this.getMergedOptions(componentOptions);

    if (componentOptions && componentOptions.props && componentOptions.props.length>0) {
      return this.generateComponentInfosForAllProps(componentOptions as any,mergedOptions,componentAssetFolderPath,componentAssetFolderName,isFirst,separators);
    }
    
    const {Component,readme,...others} = await this.getComponentComponentInfo(componentOptions,mergedOptions,componentAssetFolderPath);
    let separatedReadme = this.getComponentSeparatedReadme(readme,isFirst,separators?.componentSeparator);
    const componentInfo: ComponentInfo = {
      ...others,
      readme:separatedReadme,
      name:componentAssetFolderName,
      componentScreenshot:{
        Component,
        ...mergedOptions.screenshotOptions
      },
      altText:this.getComponentAltText(componentOptions,componentAssetFolderName)
    };
    return [componentInfo];
  }
  private async getOwnComponentInfos(separators:ComponentInfoSeparators|undefined): Promise<ComponentInfo[][]> {
    const componentAssetFolderNames = await this.system.fs.readdir(this.componentAssetsFolder);
    const orderedComponentAssetFolderNames = this.componentSorter.sort(componentAssetFolderNames);
    return await Promise.all(orderedComponentAssetFolderNames.map(async (orderedComponentAssetFolderName,i) => {
      const componentAssetFolder = this.system.path.join(this.componentAssetsFolder, orderedComponentAssetFolderName.componentFolderName);
      return this.getComponentInfosForFolder(componentAssetFolder, orderedComponentAssetFolderName.parsedName,i===0,separators);
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
  
  async getComponentInfos(componentAssetsFolder: string, globalOptions: GlobalComponentOptions,separators:ComponentInfoSeparators|undefined): Promise<ComponentInfo[]> {
    const providersInfos = await Promise.all(this.providers.map(provider => {
      return provider.getComponentInfos(componentAssetsFolder, globalOptions);
    }));
    this.componentAssetsFolder = componentAssetsFolder;
    this.globalOptions = globalOptions;
    const ownInfos = await this.getOwnComponentInfos(separators);
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
  async readReadMe(componentAssetFolder: string,readmeName='README.md',throwIfDoesNotExist=false): Promise<string|undefined> {
    const readmePath = this.system.path.join(componentAssetFolder, readmeName);
    const exists = await this.system.path.exists(readmePath);
    if(!exists){
      if(throwIfDoesNotExist){
        throw new Error(`Unable to find ${readmeName} in ${componentAssetFolder}`)
      }
      return undefined;
    }
    
    return this.system.fs.readFileString(readmePath);
  }
}
