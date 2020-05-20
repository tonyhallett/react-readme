import {generateReadme} from '../src/index'
import {ImageDetails, CodeDetails, ReadmeImageType, ISystem, IPuppeteerImageGeneratorWriter } from '../src/interfaces'
import { GeneratedReadme} from '../src/GeneratedReadme'
import { GeneratedReadmeWriter as RealGeneratedReadmeWriter} from '../src/GeneratedReadmeWriter'
import * as fs from 'fs-extra';
import * as path from 'path';
import { System as RealSystem} from '../src/System'
import { ComponentScreenshot } from '../src/PuppeteerImageGenerator'

jest.mock('../src/GeneratedReadme');
const mockGeneratedReadme = GeneratedReadme as jest.MockedClass<typeof GeneratedReadme>;
mockGeneratedReadme.prototype.toString.mockReturnValue('Fake');

const mockPuppeteerGenerateAndWrite:jest.MockedFunction<IPuppeteerImageGeneratorWriter['generateAndWrite']> = jest.fn().mockResolvedValue('')
jest.mock('../src/PuppeteerImageGeneratorWriter',() => {
  return {
    PuppeteerImageGeneratorWriter:class {
      generateAndWrite=mockPuppeteerGenerateAndWrite
    }}
});

const generatedReadmeFileName = 'GeneratedREADME.md';
const {GeneratedReadmeWriter } = jest.requireActual('../src/GeneratedReadmeWriter')
jest.mock('../src/GeneratedReadmeWriter', () => {
  return {
    createGeneratedReadmeWriter(system:ISystem){
      return new (GeneratedReadmeWriter as typeof RealGeneratedReadmeWriter)(system,generatedReadmeFileName)
    }
  }
})
let mockSystemCwd:string

jest.mock('../src/System', () => {
  const { System } = jest.requireActual('../src/System')
  const systemProxy = new Proxy<typeof RealSystem>(System,{
    construct(){
      const realSystem:RealSystem = new System();
      realSystem.cwd = mockSystemCwd;
      return realSystem;
    }
  });

  return {
    System : systemProxy
  }
})



describe('generate', () => {
  beforeEach(()=>{
    jest.clearAllMocks();
  })
  //#region ReadmeAssetsFolder
  interface GeneratedFile{
    fileName:string,contents:string
  }
  type CodeExtension = 'js'|'ts'|'tsx'
  type GeneratedReactReadme = {contents:string,extension:CodeExtension}
  interface ComponentFolder{
    name:string,
    code:GeneratedFile|Array<GeneratedFile>|undefined,
    readme:string,
    reactReadme?:string
    getReactReadmes?:()=>Array<GeneratedReactReadme>
  }
  interface MainReadme{
    readme:string,
    suffix:''|'Pre'|'Post'
  }
  
  class ReadmeAssetsFolder{
    public readmeAssetsFolderFullPath:string
    private rootReactReadmeFullPath!:string

    private static integrationTestsFolder = path.join(process.cwd(),'integrationTestsFolder');
    private static testId = 0;

    public additionalFiles:GeneratedFile[]=[];

    constructor(
      private readmes:MainReadme[],
      public readonly componentFolders:ComponentFolder[],
      readmeAssetsFolderPath:string|undefined,
      private readonly reactReadme:string|undefined
      ){
        this.cwd = path.join(ReadmeAssetsFolder.integrationTestsFolder,`test-${ReadmeAssetsFolder.testId}`);
        this.readmeAssetsFolderFullPath = path.join(this.cwd,readmeAssetsFolderPath||'README-assets');

        ReadmeAssetsFolder.testId++;
      }

    cwd:string
    async create():Promise<void> {
      await this.ensureComponentsFolder();

      await this.createRootReactReadme();
      await this.createMainReadmes();
      await this.createComponentFolders();
      
      await this.createAdditionalFiles();
    }
    private async createAdditionalFiles():Promise<void>{
      for(let additionalFile of this.additionalFiles){
        await this.ensureAndWriteInReadmeAssets(additionalFile.contents,additionalFile.fileName);
      }
    }
    
    private ensureComponentsFolder():Promise<void>{
      const componentsPath = this.getPathInReadmeAssets('components');
      return fs.ensureDir(componentsPath);
    }

    getPathInReadmeAssets(...paths:string[]):string{
      return path.join(...[this.readmeAssetsFolderFullPath].concat(paths));
    }
    private async ensureAndWrite(path:string,contents:string):Promise<void>{
      await fs.ensureFile(path);
      fs.writeFile(path,contents,'utf8');
    }
    private ensureAndWriteInReadmeAssets(contents:string,...paths:string[]):Promise<void>{
      return this.ensureAndWrite(this.getPathInReadmeAssets(...paths),contents);
    }
    private async createMainReadmes():Promise<void>{
      for(let i=0;i<this.readmes.length;i++){
        const readme = this.readmes[i];
        await this.ensureAndWriteInReadmeAssets(readme.readme,`README${readme.suffix}.MD`);
      }
    }
    private async createComponentFolders():Promise<void>{
      for(let componentFolder of this.componentFolders){
        const name = componentFolder.name;
        let allComponentFolderCode:GeneratedFile[];
        if(componentFolder.code === undefined){
          componentFolder.code = [];
        }
        if(!Array.isArray(componentFolder.code)){
          allComponentFolderCode = [componentFolder.code];
        }else{
          allComponentFolderCode = componentFolder.code;
        }
        for(let componentFolderCode of allComponentFolderCode){
          await this.ensureAndWriteInReadmeAssets(componentFolderCode.contents,'components',name,componentFolderCode.fileName);
        }
        if(componentFolder.reactReadme){
          await this.ensureAndWriteInReadmeAssets(componentFolder.reactReadme,'components',name,'react-readme.js');
        }
        if(componentFolder.getReactReadmes){
          await Promise.all(componentFolder.getReactReadmes().map(reactReadme => {
            this.ensureAndWriteInReadmeAssets(reactReadme.contents,'components',name,`react-readme.${reactReadme.extension}`);
          }));
        }
        await this.ensureAndWriteInReadmeAssets(componentFolder.readme,'components',name,'README.md');
      }
    }
    private createRootReactReadme():Promise<void>{
      if(this.reactReadme){
        this.rootReactReadmeFullPath = path.join(this.cwd,'react-readme.js');
        return fs.writeFile(this.rootReactReadmeFullPath,this.reactReadme);
      }
      return Promise.resolve();
    }
    
    async cleanUpTest():Promise<void>{
      await fs.remove(this.readmeAssetsFolderFullPath);
      if(this.rootReactReadmeFullPath){
        await fs.unlink(this.rootReactReadmeFullPath);
      }
    }
    static cleanUpAllTests():Promise<void>{
      return fs.remove(ReadmeAssetsFolder.integrationTestsFolder);
    }
    
  }
  //#endregion
  describe('no props', () => {
    type ExpectedAddComponentGenerations = Array<{imageDetails:ImageDetails|undefined,codeDetails:CodeDetails,useReadme?:true,readme?:string}>;
    interface IntegrationTest{
      description:string,
      folderArgs:ConstructorParameters<typeof ReadmeAssetsFolder>,
      additionalFiles?:GeneratedFile[]
      expectedSurroundPre:string|undefined,
      expectedSurroundPost:string|undefined,
      expectedAddComponentGenerations:ExpectedAddComponentGenerations
      
      additionalExpectations?:(readmeAssetFolder:ReadmeAssetsFolder)=>Promise<void>|void
      afterFolderCreation?:(readmeAssetFolder:ReadmeAssetsFolder)=>Promise<void>|void
    }
    function createCodeFileComponent(extension:'ts'|'tsx'|'js',isComponent1:boolean){
      const component = `Component${isComponent1?'1':'2'}`;
      return `function(){
        //react.createElement.... ${component} ${extension}
        }`;
    }
    type ExportType = 'ExportsEquals'|'ExportsDefault'
    function createCodeFile(extension:'ts'|'tsx'|'js',isComponent1:boolean,exportType:ExportType='ExportsEquals'):GeneratedFile{
      const exportsEquals = exportType === 'ExportsEquals';
      const component = createCodeFileComponent(extension, isComponent1);
      return {
        contents:`
        module.exports${exportsEquals?'':'.default'} = ${component}`,
        fileName:`index.${extension}`
      }
    }
    function createComponentFolders(andTs:boolean,exportType:ExportType='ExportsEquals',folderName1='Component1',folderName2='Component2'){
      function createComponentFolder(isComponent1:boolean){
        const component = isComponent1?folderName1:folderName2;
        const code = andTs?
          [createCodeFile('js',isComponent1,exportType),createCodeFile('ts',isComponent1,exportType)]:
          createCodeFile('js',isComponent1,exportType);
        return {
          code,
          name:`${component}`,
          readme:`${component} read me`
        }
      }

      const componentFolders:ComponentFolder[] = [
        createComponentFolder(true),
        createComponentFolder(false)
      ]
      return componentFolders;
    }
    const jsOnlyComponentFolders:ComponentFolder[] = [{
      code:createCodeFile('js',true),
      name:'Component1',
      readme:'Component1 read me'
    },
    {
      code:createCodeFile('js',false),
      name:'Component2',
      readme:'Component2 read me'
    }
    ]
    const jsTsComponentFolders:ComponentFolder[] = createComponentFolders(true);
    function getJsOnlyExpectedAddComponentGeneration(assetsFolder = 'README-assets'){
      return [
        {
          codeDetails:{code:(jsOnlyComponentFolders[0].code as GeneratedFile).contents,language:'javascript'},
          imageDetails:{
            altText:'',
            componentImagePath:path.join(assetsFolder,'images',`${jsOnlyComponentFolders[0].name}.png`)}
        },
        {
          codeDetails:{code:(jsOnlyComponentFolders[1].code as GeneratedFile).contents,language:'javascript'},
          imageDetails:{
            altText:'',
            componentImagePath:path.join(assetsFolder,'images',`${jsOnlyComponentFolders[1].name}.png`)}
        }
      ]
    }
    function getJsTsExpectedAddComponentGeneration(expectTs:boolean,assetsFolder = 'README-assets',imageType:ReadmeImageType='png',componentFolders:ComponentFolder[]=jsTsComponentFolders){
      const index = expectTs?1:0;
      const language = expectTs?'typescript':'javascript';
      return [
        {
          codeDetails:{code:(componentFolders[0].code as GeneratedFile[])[index].contents,language},
          imageDetails:{
            altText:'',
            componentImagePath:path.join(assetsFolder,'images',`${componentFolders[0].name}.${imageType}`)}
        },
        {
          codeDetails:{code:(componentFolders[1].code as GeneratedFile[])[index].contents,language},
          imageDetails:{
            altText:'',
            componentImagePath:path.join(assetsFolder,'images',`${componentFolders[1].name}.${imageType}`)}
        }
      ]
    }

    //#region tests

    const basicNoPropsTest:IntegrationTest=(()=>{
      
      const test:IntegrationTest = {
        description:'Default assets folder, no react-readme.js, pre and post',
        folderArgs:[
          [{suffix:'Pre',readme:'Pre'},{suffix:'Post',readme:'Post'}],
          jsOnlyComponentFolders,
          undefined,
          undefined
        ],
        expectedSurroundPre:'Pre',
        expectedSurroundPost:'Post',
        expectedAddComponentGenerations:getJsOnlyExpectedAddComponentGeneration()
      }
      return test;
    })();

    //root react-readme.js
    const differentAssetsFolderTest:IntegrationTest = (()=>{
      const customAssetsFolder = 'CustomReadmeAssets';
      const test:IntegrationTest = {
        description:'Root react-readme.js specifying folder path. No explicit pre, no post',
        expectedSurroundPre:'Pre',
        expectedSurroundPost:undefined,
        folderArgs:[
          [{suffix:'',readme:'Pre'}],
          jsOnlyComponentFolders,
          customAssetsFolder,
          `
          module.exports = {
            readmeAssetsFolderPath:'${customAssetsFolder}'
          }
          `
        ],
        expectedAddComponentGenerations:getJsOnlyExpectedAddComponentGeneration(customAssetsFolder)

      }
      return test;
    })();
    const typescriptCodeTest:IntegrationTest = (() => {
      const test:IntegrationTest = {
        description:'typescript by default chosen over javascript',
        expectedSurroundPre:'Pre',
        expectedSurroundPost:undefined,
        expectedAddComponentGenerations:getJsTsExpectedAddComponentGeneration(true),
        folderArgs:[
          [{suffix:'',readme:'Pre'}],
          jsTsComponentFolders,
          undefined,
          undefined
        ]
      }
      return test;
    })();
    //root react-readme.js
    const puppetterLaunchOptionsTest:IntegrationTest = (()=> {
      const test:IntegrationTest={
        description:'Puppetter launch options from global options',
        expectedAddComponentGenerations:[],
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],[],undefined,`
          module.exports = {
            puppeteerLaunchOptions:{
              some:'launch option'
            }
          }
          `
        ],
        additionalExpectations:() => {
          expect(mockPuppeteerGenerateAndWrite.mock.calls[0][1]).toEqual({some:'launch option'})
        }
      }
      return test;
    })();
    const cleansImagesTest:IntegrationTest = (()=> {
      const test:IntegrationTest={
        description:'Test cleans images',
        expectedAddComponentGenerations:[],
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],[],undefined,undefined
        ],
        additionalFiles:[{
          contents:'',
          fileName:path.join('images','shouldBeDeleted')
        }],
        afterFolderCreation:async(readmeAssetsFolder:ReadmeAssetsFolder) =>{
          expect(await fs.pathExists(path.join(readmeAssetsFolder.readmeAssetsFolderFullPath,test.additionalFiles![0].fileName))).toBe(true);
        },
        additionalExpectations:async (readmeAssetsFolder:ReadmeAssetsFolder) => {
          expect(await fs.pathExists(path.join(readmeAssetsFolder.readmeAssetsFolderFullPath,test.additionalFiles![0].fileName))).toBe(false);
        }
        
      }
      return test;
    })();

    const preferJsGlobalTest:IntegrationTest = (()=> {
      const test:IntegrationTest={
        description:'Prefer js in global options',
        expectedAddComponentGenerations:getJsTsExpectedAddComponentGeneration(false),
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],jsTsComponentFolders,undefined,`{
            module.exports = {
              codeInReadme:'Js'
            }
          }`
        ],
      }
      return test;
    })();

    const noCodeGenerationTestGlobal:IntegrationTest = (()=> {
      const componentGenerations =getJsTsExpectedAddComponentGeneration(false);
      componentGenerations.forEach(componentGeneration => {
        componentGeneration.codeDetails.code='';
        componentGeneration.codeDetails.language='';
      })
      const test:IntegrationTest={
        description:'No code generation in global options',
        expectedAddComponentGenerations:componentGenerations,
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],jsTsComponentFolders,undefined,`{
            module.exports = {
              codeInReadme:'None'
            }
          }`
        ],
      }
      return test;
    })();
    
    //root react-readme.js 
    const imageTypeJpegTest:IntegrationTest = (()=> {
      const test:IntegrationTest={
        description:'Global image type',
        expectedAddComponentGenerations:getJsTsExpectedAddComponentGeneration(true,undefined,'jpeg'),
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],jsTsComponentFolders,undefined,`{
            module.exports = {
              screenshotOptions:{
                type:'jpeg'
              }
            }
          }`
        ],
        additionalExpectations: () => {
          const componentScreenshots:Array<ComponentScreenshot> = mockPuppeteerGenerateAndWrite.mock.calls[0][0];
          componentScreenshots.forEach(componentScreenshot => {
            expect(componentScreenshot.type).toBe('jpeg');
          })
        }
      }
      return test;
    })();

    //root react-readme.js
    const codeReplacerTest:IntegrationTest = (()=> {
      const expectedAddComponentGenerations = getJsTsExpectedAddComponentGeneration(true);
      expectedAddComponentGenerations.forEach(expectedCodeGeneration => {
        expectedCodeGeneration.codeDetails.code += 'replaced';
      })
      const test:IntegrationTest={
        description:'Global code replacer',
        expectedAddComponentGenerations,
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],jsTsComponentFolders,undefined,`{
            module.exports = {
              codeReplacer: code => code + 'replaced'
            }
          }`
        ],
      }
      return test;
    })();

    const optionsMerging:IntegrationTest = (()=> {
      const componentFolders = createComponentFolders(true);
      componentFolders[0].reactReadme = `
        module.exports = {
          screenshotOptions:{
            type:'png'
          }
        }
      `
      const expectedAddComponentGenerations = getJsTsExpectedAddComponentGeneration(true)
      const pngPath= expectedAddComponentGenerations[1].imageDetails.componentImagePath;
      expectedAddComponentGenerations[1].imageDetails.componentImagePath = pngPath.replace('png','jpeg');

      const test:IntegrationTest={
        description:'Options merging',
        expectedAddComponentGenerations,
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],componentFolders,undefined,`{
            module.exports = {
              screenshotOptions:{
                type:'jpeg'
              }
            }
          }`
        ],
        additionalExpectations:() => {
          const componentScreenshots = mockPuppeteerGenerateAndWrite.mock.calls[0][0];
          expect(componentScreenshots[0].type).toBe('png');
          expect(componentScreenshots[1].type).toBe('jpeg');
        }
      }
      return test;
    })();

    const componentScreenshotsTest:IntegrationTest = (()=> {
      const componentFolders = createComponentFolders(true);
      
      componentFolders[0].reactReadme = `
        module.exports = {
          screenshotOptions:{
            type:'png'
          }
        }
      `
      const expectedAddComponentGenerations = getJsTsExpectedAddComponentGeneration(true)
      const pngPath= expectedAddComponentGenerations[1].imageDetails.componentImagePath;
      expectedAddComponentGenerations[1].imageDetails.componentImagePath = pngPath.replace('png','jpeg');

      const test:IntegrationTest={
        description:'component screenshots',
        expectedAddComponentGenerations,
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],componentFolders,undefined,`{
            module.exports = {
              screenshotOptions:{
                type:'jpeg',
                css:'Some css',
                height:10,
                width:20,
                webfont:'some webfont',
                props:{
                  prop1:1
                }
              }
            }
          }`
        ],
        additionalExpectations:(readmeAssetFolder) => {
          const componentScreenshots = mockPuppeteerGenerateAndWrite.mock.calls[0][0];
          function expectComponent(first:boolean){
            const component = componentScreenshots[first?0:1].Component;
            expect((component as any).toString()).toBe(createCodeFileComponent('js',first));
          }
          function expectId(first:boolean,type:ReadmeImageType){
            expect(componentScreenshots[first?0:1].id).toBe(readmeAssetFolder.getPathInReadmeAssets('images',`Component${first?'1':'2'}.${type}`));
          }
          
          expectComponent(true);
          expectId(true,'png');
          expect(componentScreenshots[0].type).toBe('png');
          expect(componentScreenshots[0].css).toBeUndefined();//etc
          
          const secondScreenshot = componentScreenshots[1];
          expectComponent(false);
          expectId(false,"jpeg");
          expect(secondScreenshot.css).toBe('Some css');
          expect(secondScreenshot.height).toBe(10);
          expect(secondScreenshot.props).toEqual({prop1:1});
          expect(secondScreenshot.type).toBe('jpeg');
          expect(secondScreenshot.webfont).toBe('some webfont');
          expect(secondScreenshot.width).toBe(20);

        }
      }
      return test;
    })();

    const componentScreenshotsExportDefaultTest:IntegrationTest = (()=> {
      const componentFolders = createComponentFolders(true,'ExportsDefault');
      
      
      const expectedAddComponentGenerations = getJsTsExpectedAddComponentGeneration(true,undefined,undefined,componentFolders)

      const test:IntegrationTest={
        description:'component screenshots, Component is exports.default',
        expectedAddComponentGenerations,
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],componentFolders,undefined,undefined
        ],
        additionalExpectations:() => {
          const componentScreenshots = mockPuppeteerGenerateAndWrite.mock.calls[0][0];
          function expectComponent(first:boolean){
            expect((componentScreenshots[first?0:1].Component as any).toString()).toBe(createCodeFileComponent('js',first));
          }
          
          expectComponent(true);
          expectComponent(false);
        }
      }
      return test;
    })();

    function createComponentInReadmeTest(description:string,key:string|undefined,typescript=false){
      function createComponent(isTypescript:boolean){
        const language = isTypescript?'typescript':'javascript';
        return `function ImportedComponent(){
          //return <div/> ${language}
        }`
      }
      function createImportedComponent(exportsKey:string|undefined, isTypescript:boolean){
        const component = createComponent(isTypescript);
        const exportsEquals = `
      module.exports = ${component}`
      const exportsProperty = `
      module.exports = {
        ${key}:${component}
      }`;
      return exportsKey === undefined?exportsEquals:exportsProperty;
      }
      const jsImportedComponent = createImportedComponent(key,false);
      const tsImportedComponent = createImportedComponent(key,true);
    
      const importedComponentName = 'ImportedComponent';
      const importedComponentNameJs = `${importedComponentName}.js`;
      const componentFolders = createComponentFolders(true);
      const requiringReactReadme = `
        module.exports = {
          component:require('../../${importedComponentNameJs}')${key===undefined?'':`.${key}`}
        }
      `
      componentFolders[0].reactReadme = requiringReactReadme;
      delete componentFolders[0].code;
      
      const expectedAddComponentGenerations = getJsTsExpectedAddComponentGeneration(true)
      expectedAddComponentGenerations[0].codeDetails = {
        code:typescript?tsImportedComponent:jsImportedComponent,
        language:typescript?'typescript':'javascript'
      }
      
      const test:IntegrationTest={
        description,
        expectedAddComponentGenerations,
        expectedSurroundPre:undefined,
        expectedSurroundPost:undefined,
        folderArgs:[
          [],componentFolders,undefined,undefined
        ],
        additionalFiles: [
          { contents:jsImportedComponent,
            fileName:importedComponentNameJs
          }
        ]
      };
      if(typescript){
        test.additionalFiles!.push({
          contents:tsImportedComponent,
          fileName:`${importedComponentName}.ts`
        })
      }
      test.additionalExpectations=()=>{
        const componentScreenshots = mockPuppeteerGenerateAndWrite.mock.calls[0][0];
        expect((componentScreenshots[0].Component as any).toString()).toBe(createComponent(false));
      }
      return test;
    }
    const importedComponentInReadmePathFinderExportsEqualTest = createComponentInReadmeTest('Component imported in readme, path found, exports =',undefined);
    const importedComponentInReadmePathFinderExportPropertyTest = createComponentInReadmeTest('Component imported in readme, path found, exports property','someProperty');
    //same test as above
    //const importedComponentInReadmePathFinderExportsDefaultTest = createComponentInReadmeTest('Component imported in readme, path found, exports default','default');
    const importedComponentInReadmePathTypescriptTest = createComponentInReadmeTest('Component imported in readme, path found, typescript used',undefined, true);


    function createInlineComponentInReadmeTest(reactReadmeExtension:CodeExtension):IntegrationTest{
      
      const getReactReadmeAndComponent=(extension:CodeExtension)=>{
        function getExportsEquals(isJs:boolean,equalTo:string){
          const exports = isJs?'module.exports':'export';
          return `${exports} = ${equalTo}`;
        }
        const component = '' + 
  `class {
    render(){
      return null;//${extension}
    }
  }`;
    
    const componentExports =`{
      component:${component}
    }`
    const reactReadme = getExportsEquals(extension==='js',componentExports);
  
      return {component,reactReadme}
      }
      const expectedLanguage = (()=> {
        const expectedLanguageLookup = new Map<string,string>();
        expectedLanguageLookup.set('js','javascript');
        expectedLanguageLookup.set('ts','typescript');
        expectedLanguageLookup.set('tsx','tsx');

        return expectedLanguageLookup.get(reactReadmeExtension);
      })();
      

      const jsComponentAndReadme = getReactReadmeAndComponent('js');
      let expectedReadmeComponent = jsComponentAndReadme.component;

      const componentFolder:ComponentFolder = {
        readme:'',
        name:'InlineComponent',
        code:undefined, 
      }
      if(reactReadmeExtension==='js'){
        componentFolder.reactReadme = jsComponentAndReadme.reactReadme;
      }else{
        const expectedComponentAndReadme = getReactReadmeAndComponent(reactReadmeExtension);
        expectedReadmeComponent=expectedComponentAndReadme.component;
        componentFolder.getReactReadmes=()=>{
          const reactReadmes:Array<GeneratedReactReadme> =   [
            {contents:jsComponentAndReadme.reactReadme,extension:'js'},
            {contents:expectedComponentAndReadme.reactReadme,extension:reactReadmeExtension}
          ]
          return reactReadmes;
        }
      }
      const test:IntegrationTest = {
        description:`inline component ${reactReadmeExtension}`,
        expectedSurroundPost:undefined,
        expectedSurroundPre:undefined,
        folderArgs:[
          [],
          [componentFolder],
          undefined,
          undefined
        ],
        expectedAddComponentGenerations:[{
          imageDetails:{altText:'',componentImagePath:path.join('README-assets','images','InlineComponent.png')},
          codeDetails:{code:expectedReadmeComponent,language:expectedLanguage!}
        }],
        additionalExpectations:()=>{
          const componentScreenshots = mockPuppeteerGenerateAndWrite.mock.calls[0][0];
          expect((componentScreenshots[0].Component as any).toString()).toBe(jsComponentAndReadme.component);
        }
      }
      return test;
    }

    const inlineComponentTests = (['js','ts','tsx'] as Array<CodeExtension>).map(ext => createInlineComponentInReadmeTest(ext));
    
    const altTextAndSortingTest:IntegrationTest = (()=> {
      const componentFolders = createComponentFolders(false,undefined,'ComponentX_2','ComponentY_1');
      componentFolders[0].reactReadme = `
        module.exports = {
          altText:'Component options alt text'
        }
      `
      const expectedAddComponentGenerations:ExpectedAddComponentGenerations = [
        {
          codeDetails:{code:(componentFolders[1].code as GeneratedFile).contents,language:'javascript'},
          imageDetails:{
            altText:'ComponentY',
            componentImagePath:path.join('README-assets','images',`ComponentY.png`)
          },
          useReadme:true,
          readme:'ComponentY_1 read me'
        },
        {
          codeDetails:{code:(componentFolders[0].code as GeneratedFile).contents,language:'javascript'},
          imageDetails:{
            altText:'Component options alt text',
            componentImagePath:path.join('README-assets','images',`ComponentX.png`)
          },
          useReadme:true,
          readme:'ComponentX_2 read me'
        },
      ]
      
      const test:IntegrationTest = {
        description:'Alt text',
        expectedSurroundPost:undefined,
        expectedSurroundPre:undefined,
        expectedAddComponentGenerations,
        folderArgs:[
          [],
          componentFolders,
          undefined,
          `
          module.exports = {
            altTextFromFolderName:true
          }
          `
        ]
      }
      return test;
    })();
    //#endregion
    
    //there are options affecting props that have not tested but covered by unit tests

    const propsIntegrationTest:IntegrationTest = (() => {
      const componentFolders:ComponentFolder[] = [
        {
          code:{
            contents:'module.exports = function Component(){}',
            fileName:'index.js'
          },
          name:'Component',
          readme:'component readme',
          reactReadme:`
            module.exports = {
              props:[
                {prop1:1},
                [{prop1:2},{altText:'props2 alt text', readme:'props2 read me'}],
                [{prop1:3},{altText:'props3 alt text', readmeFileName:'props3_readme.md'}]
              ]
            }
          `
        }
      ]  
      
      const expectedAddComponentGenerations:ExpectedAddComponentGenerations = [
        {
          useReadme:true,
          readme:'component readme',
          codeDetails:{
            code:(componentFolders[0].code as any).contents,
            language:'javascript'
          },
          imageDetails:undefined,
        },
        {
          useReadme:true,
          readme:undefined,
          codeDetails:{
            code:'{prop1:1}',
            language:'javascript'
          },
          imageDetails:{
            altText:'',
            componentImagePath:path.join('README-assets','images',`Component-props-0.png`)
          }
        },
        {
          useReadme:true,
          readme:'props2 read me',
          codeDetails:{
            code:'{prop1:2}',
            language:'javascript'
          },
          imageDetails:{
            altText:'props2 alt text',
            componentImagePath:path.join('README-assets','images',`Component-props-1.png`)
          }
        },
        {
          useReadme:true,
          readme:'props3 read me from file',
          codeDetails:{
            code:'{prop1:3}',
            language:'javascript'
          },
          imageDetails:{
            altText:'props3 alt text',
            componentImagePath:path.join('README-assets','images',`Component-props-2.png`)
          }
        },

      ]

      const test:IntegrationTest = {
        description:'Props',
        expectedSurroundPost:undefined,
        expectedSurroundPre:undefined,
        expectedAddComponentGenerations,
        folderArgs:[
          [],
          componentFolders,
          undefined,
          `
          module.exports = {
            altTextFromFolderName:true
          }
          `
        ],
        additionalFiles:[
          {
            fileName:path.join('components','Component','props3_readme.md'),
            contents:'props3 read me from file'
          }
        ],
        additionalExpectations(){
          const componentScreenshots = mockPuppeteerGenerateAndWrite.mock.calls[0][0];
          componentScreenshots.forEach(componentScreenshot => {
            expect((componentScreenshot.Component as any).toString()).toBe('function Component(){}');
          })
        }
      }
      return test;
    })();

    const tests:IntegrationTest[] = [
      basicNoPropsTest,
      differentAssetsFolderTest,
      typescriptCodeTest, // ts over js is the default
      preferJsGlobalTest, // global react-readme.js
      noCodeGenerationTestGlobal, // global
      imageTypeJpegTest,
      puppetterLaunchOptionsTest,
      cleansImagesTest,
      codeReplacerTest, 
      optionsMerging,
      importedComponentInReadmePathFinderExportsEqualTest,
      importedComponentInReadmePathFinderExportPropertyTest,
      importedComponentInReadmePathTypescriptTest,
      componentScreenshotsTest,
      componentScreenshotsExportDefaultTest,
      ...inlineComponentTests,
      altTextAndSortingTest,
      propsIntegrationTest
    ]

    
    afterAll(()=>{
      ReadmeAssetsFolder.cleanUpAllTests();
    })
    tests.forEach(test => {
      it(`${test.description}`, async() => {
        const readmeAssetsFolder = new ReadmeAssetsFolder(...test.folderArgs);
        if(test.additionalFiles && test.additionalFiles.length>0){
          readmeAssetsFolder.additionalFiles=test.additionalFiles;
        }
        

        await readmeAssetsFolder.create();
        if(test.afterFolderCreation){
          await test.afterFolderCreation(readmeAssetsFolder);
        }

        async function generateAndExpect(){
          mockSystemCwd = readmeAssetsFolder.cwd;

          
          await generateReadme()
          
          //expect writes readme
          const generated = await fs.readFile(path.join(readmeAssetsFolder.cwd,generatedReadmeFileName),'utf8');
          expect(generated).toBe('Fake');
          
          
          (function expectGeneratedReadme(){
            expect(mockGeneratedReadme.prototype.surroundWith).toHaveBeenCalledWith(test.expectedSurroundPre,test.expectedSurroundPost);

            expect(mockGeneratedReadme.prototype.addComponentGeneration).toHaveBeenCalledTimes(test.expectedAddComponentGenerations.length);
            const componentFolders = readmeAssetsFolder.componentFolders;
            test.expectedAddComponentGenerations.forEach((expectedAddComponentGeneration,i) => {
              expect(mockGeneratedReadme.prototype.addComponentGeneration)
                .toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(
                  i+1,
                  expectedAddComponentGeneration.codeDetails,
                  //first case when the folders are prefix sorted
                  expectedAddComponentGeneration.useReadme?expectedAddComponentGeneration.readme:componentFolders[i].readme,
                  expectedAddComponentGeneration.imageDetails);
            })
          })();

          if(test.additionalExpectations){
            await test.additionalExpectations(readmeAssetsFolder);
          }
        }
        
        await generateAndExpect();
        
      },100000)
      
    })
    
  })
})