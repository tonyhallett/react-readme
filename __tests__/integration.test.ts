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
  interface ComponentFolder{
    name:string,
    code:GeneratedFile|Array<GeneratedFile>,
    readme:string,
    reactReadme?:string
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
    interface NoPropsIntegrationTest{
      description:string,
      folderArgs:ConstructorParameters<typeof ReadmeAssetsFolder>,
      additionalFiles?:GeneratedFile[]
      expectedSurroundPre:string|undefined,
      expectedSurroundPost:string|undefined,
      expectedAddComponentGenerations:Array<{imageDetails:ImageDetails,codeDetails:CodeDetails}>
      additionalExpectations?:(readmeAssetFolder:ReadmeAssetsFolder)=>Promise<void>|void
      afterFolderCreation?:(readmeAssetFolder:ReadmeAssetsFolder)=>Promise<void>|void
    }
    function createCodeFileComponent(extension:'ts'|'tsx'|'js',isComponent1:boolean){
      const component = `Component${isComponent1?'1':'2'}`;
      return `function(){
        //react.createElement.... ${component} ${extension}
        }`;
    }
    function createCodeFile(extension:'ts'|'tsx'|'js',isComponent1:boolean):GeneratedFile{
      const component = createCodeFileComponent(extension, isComponent1);
      return {
        contents:`
        module.exports = ${component}`,
        fileName:`index.${extension}`
      }
    }
    function createComponentFolders(andTs:boolean){
      function createComponentFolder(isComponent1:boolean){
        const component = isComponent1?'Component1':'Component2';
        const code = andTs?
          [createCodeFile('js',isComponent1),createCodeFile('ts',isComponent1)]:
          createCodeFile('js',isComponent1);
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
            altText:jsOnlyComponentFolders[0].name,
            componentImagePath:path.join(assetsFolder,'images',`${jsOnlyComponentFolders[0].name}.png`)}
        },
        {
          codeDetails:{code:(jsOnlyComponentFolders[1].code as GeneratedFile).contents,language:'javascript'},
          imageDetails:{
            altText:jsOnlyComponentFolders[1].name,
            componentImagePath:path.join(assetsFolder,'images',`${jsOnlyComponentFolders[1].name}.png`)}
        }
      ]
    }
    function getJsTsExpectedAddComponentGeneration(expectTs:boolean,assetsFolder = 'README-assets',imageType:ReadmeImageType='png'){
      const index = expectTs?1:0;
      const language = expectTs?'typescript':'javascript';
      return [
        {
          codeDetails:{code:(jsTsComponentFolders[0].code as GeneratedFile[])[index].contents,language},
          imageDetails:{
            altText:jsTsComponentFolders[0].name,
            componentImagePath:path.join(assetsFolder,'images',`${jsTsComponentFolders[0].name}.${imageType}`)}
        },
        {
          codeDetails:{code:(jsTsComponentFolders[1].code as GeneratedFile[])[index].contents,language},
          imageDetails:{
            altText:jsTsComponentFolders[1].name,
            componentImagePath:path.join(assetsFolder,'images',`${jsTsComponentFolders[1].name}.${imageType}`)}
        }
      ]
    }

    //#region tests

    const basicNoPropsTest:NoPropsIntegrationTest=(()=>{
      
      const test:NoPropsIntegrationTest = {
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
    const differentAssetsFolderTest:NoPropsIntegrationTest = (()=>{
      const customAssetsFolder = 'CustomReadmeAssets';
      const test:NoPropsIntegrationTest = {
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
    const typescriptCodeTest:NoPropsIntegrationTest = (() => {
      const test:NoPropsIntegrationTest = {
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
    const puppetterLaunchOptionsTest:NoPropsIntegrationTest = (()=> {
      const test:NoPropsIntegrationTest={
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
    const cleansImagesTest:NoPropsIntegrationTest = (()=> {
      const test:NoPropsIntegrationTest={
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

    const preferJsGlobalTest:NoPropsIntegrationTest = (()=> {
      const test:NoPropsIntegrationTest={
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

    const noCodeGenerationTestGlobal:NoPropsIntegrationTest = (()=> {
      const componentGenerations =getJsTsExpectedAddComponentGeneration(false);
      componentGenerations.forEach(componentGeneration => {
        componentGeneration.codeDetails.code='';
        componentGeneration.codeDetails.language='';
      })
      const test:NoPropsIntegrationTest={
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
    const imageTypeJpegTest:NoPropsIntegrationTest = (()=> {
      const test:NoPropsIntegrationTest={
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
    const codeReplacerTest:NoPropsIntegrationTest = (()=> {
      const expectedAddComponentGenerations = getJsTsExpectedAddComponentGeneration(true);
      expectedAddComponentGenerations.forEach(expectedCodeGeneration => {
        expectedCodeGeneration.codeDetails.code += 'replaced';
      })
      const test:NoPropsIntegrationTest={
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

    const optionsMerging:NoPropsIntegrationTest = (()=> {
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

      const test:NoPropsIntegrationTest={
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

    const componentScreenshotsTest:NoPropsIntegrationTest = (()=> {
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

      const test:NoPropsIntegrationTest={
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
            expect((componentScreenshots[first?0:1].Component as any).toString()).toBe(createCodeFileComponent('js',first));
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

    function createComponentInReadmeTest(description:string,importedComponentDefault:boolean,typescript=false){
      function createImportedComponent(isDefault:boolean, isTypescript:boolean){
        const language = isTypescript?'typescript':'javascript';
        const defaultExport = `
      module.exports = function ImportedComponent(){
          //return <div/> ${language}
      }`
      const exportsProperty = `
      module.exports = {
        importedComponent:function ImportedComponent(){
          //return <div/>  ${language}
        }
      }`;
      return isDefault?defaultExport:exportsProperty;
      }
      const jsImportedComponent = createImportedComponent(importedComponentDefault,false);
      const tsImportedComponent = createImportedComponent(importedComponentDefault,true);
    
      const importedComponentName = 'ImportedComponent';
      const importedComponentNameJs = `${importedComponentName}.js`;
      const componentFolders = createComponentFolders(true);
      const requiringReactReadme = `
        module.exports = {
          component:require('../../${importedComponentNameJs}')${importedComponentDefault?'':'.importedComponent'}
        }
      `
      componentFolders[0].reactReadme = requiringReactReadme;
      delete componentFolders[0].code;
      
      const expectedAddComponentGenerations = getJsTsExpectedAddComponentGeneration(true)
      expectedAddComponentGenerations[0].codeDetails = {
        code:typescript?tsImportedComponent:jsImportedComponent,
        language:typescript?'typescript':'javascript'
      }
      
      const test:NoPropsIntegrationTest={
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
      return test;
    }
    const importedComponentInReadmePathFinderDefaultTest = createComponentInReadmeTest('Component imported in readme, path found, default export',true);
    const importedComponentInReadmePathFinderExportPropertyTest = createComponentInReadmeTest('Component imported in readme, path found, exports property',false);
    const importedComponentInReadmePathTypescriptTest = createComponentInReadmeTest('Component imported in readme, path found, typescript used',false, true);


    //#endregion
    
    

    const noPropsIntegrationTests:NoPropsIntegrationTest[] = [
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
      importedComponentInReadmePathFinderDefaultTest,
      importedComponentInReadmePathFinderExportPropertyTest,
      importedComponentInReadmePathTypescriptTest,
      componentScreenshotsTest
      
    ]

    
    afterAll(()=>{
      ReadmeAssetsFolder.cleanUpAllTests();
    })
    noPropsIntegrationTests.forEach(test => {
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
                  componentFolders[i].readme,
                  expectedAddComponentGeneration.imageDetails);
            })
          })();

          if(test.additionalExpectations){
            await test.additionalExpectations(readmeAssetsFolder);
          }
        }
        
        await generateAndExpect();
        
      })
      
    })
    
  })
})