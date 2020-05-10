import { CodeDetails, ComponentInfo, ISystem , IRequirer, IReactReadme} from '../interfaces';
import { IAssetFolderProvider, FolderOptions, GlobalComponentOptions, CodeReplacer, ReadmeComponentScreenshotOptions } from './AssetManager';

export interface IAssetFolderComponentInfoProvider<T extends GlobalComponentOptions=any>{
  getComponentInfos(componentAssetsFolder: string, globalOptions: T): Promise<ComponentInfo[]>
}

export interface SortedComponentFolder{componentFolderName:string,parsedName:string}
export interface IComponentSorter{
  sort(componentFolderNames:string[]):Array<SortedComponentFolder>
}

export interface IComponentFolderOptionsProvider{
  getOptions(componentFolderPath:string):Promise<FolderOptions|undefined>
}

export class AssetFolderProvider implements IAssetFolderProvider {
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
  private providers: IAssetFolderComponentInfoProvider[] = [];
  constructor(
    private readonly system: ISystem, 
    private readonly requirer: IRequirer, 
    private readonly componentFolderOptionsProvider: IComponentFolderOptionsProvider, 
    private readonly componentSorter: IComponentSorter) { }
  registerAssetFolderProviders(...providers: IAssetFolderComponentInfoProvider[]):void {
    this.providers = providers;
  }
  private async hasProps(componentAssetFolder: string): Promise<boolean> {
    return await this.system.path.exists(this.system.path.join(componentAssetFolder, 'props.js')) ||
      await this.system.path.exists(this.system.path.join(componentAssetFolder, 'props'));
  }
  private generateComponentInfosForProps(componentAssetFolder: string, folderOptions: FolderOptions): Promise<ComponentInfo[]> {
    throw new Error();
  }
  
  private async getMergedOptions(componentAssetFolderPath: string): Promise<FolderOptions> {
    const folderOptions = await this.componentFolderOptionsProvider.getOptions(componentAssetFolderPath);
    // todo - for a moment
    return { ...this.globalOptions, ...folderOptions };
  }
  //not doing module resolution yet - so they must have file path
  private getAbsolutePathToJs(componentAssetFolderPath: string, jsPath: string): string {
    if (this.system.path.isAbsolute(jsPath)) {
      return jsPath;
    }
    return this.system.path.join(componentAssetFolderPath, jsPath);
  }
  private async getComponentInfosForFolder(componentAssetFolderPath: string, componentAssetFolderName: string): Promise<ComponentInfo[]> {
    const mergedFolderOptions = await this.getMergedOptions(componentAssetFolderPath);
    if (await this.hasProps(componentAssetFolderPath)) {
      return this.generateComponentInfosForProps(componentAssetFolderPath, mergedFolderOptions);
    }
    const readme = await this.readComponentReadMe(componentAssetFolderPath);
    // Current readme code is not looking for specific export.... 
    const componentPath = mergedFolderOptions && mergedFolderOptions.componentPath ? this.getAbsolutePathToJs(componentAssetFolderPath, mergedFolderOptions.componentPath) :
      this.system.path.join(componentAssetFolderPath, 'index.js');
    const codeDetails = await this.getComponentCode(componentPath, mergedFolderOptions.codeInReadme, mergedFolderOptions.codeReplacer);
    const componentScreenshot = this.getComponentScreenshot(componentPath, mergedFolderOptions.screenshotOptions);
    const componentInfo: ComponentInfo = {
      codeDetails,
      readme,
      name: componentAssetFolderName,
      componentScreenshot
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
  private globalOptions!: GlobalComponentOptions;
  private componentAssetsFolder!: string;
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
  private async readComponentCode(componentPath: string, javascript: boolean): Promise<CodeDetails> {
    const languageLookup = javascript ? [this.languageLookup[2]] : this.languageLookup;
    const prefix = componentPath.substr(0, componentPath.length - 3);
    const { didRead, read, readPath } = await this.system.fs.readUntilExists(...languageLookup.map(entry => `${prefix}${entry.extension}`));
    if (!didRead) {
      throw new Error('no component file found');
    }
    return {
      code: read!,
      language: languageLookup.find(entry => entry.extension === this.system.path.extname(readPath!))!.language
    };
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
  async getComponentCode(componentPath: string, codeInReadme: "None" | "Js" | undefined, codeReplacer: CodeReplacer | undefined): Promise<CodeDetails> {
    if (codeInReadme === 'None') {
      const noCodeDetails: CodeDetails = {
        code: '',
        language: ''
      };
      return Promise.resolve(noCodeDetails);
    }
    const { code, language } = await this.readComponentCode(componentPath, codeInReadme === 'Js');
    return {
      code: this.getCodeReplacer(codeReplacer)(code),
      language
    };
  }
  getComponentScreenshot(componentPath: string, screenshotOptions: ReadmeComponentScreenshotOptions | undefined, exportProperty = 'default'): Pick<import("../PuppeteerImageGenerator").Options<{}>, "css" | "webfont" | "type" | "width" | "height" | "props"> & {
    type?: "jpeg" | "png" | undefined;
  } & {
    Component: import("react").ComponentType<{}>;
  } {
    const Component = this.requirer.require(componentPath)[exportProperty];
    return {
      Component,
      ...screenshotOptions
    };
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
