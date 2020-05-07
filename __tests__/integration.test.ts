import generate from '../src/generate'
import { AssetManager } from '../src/AssetManager'
import { AssetFolderProvider } from '../src/AssetFolderProvider'
import { AssetManagerOptions } from '../src/AssetManagerOptions'
import { IRequirer, IPuppeteerImageGeneratorWriter, ImageDetails, CodeDetails } from '../src/interfaces'
import { SuffixComponentSorter } from '../src/SuffixComponentSorter'
import { GeneratedReadme} from '../src/GeneratedReadme'
import { GeneratedReadmeWriter} from '../src/GeneratedReadmeWriter'
import { ReactReadme} from '../src/ReactReadme'
import { System} from '../src/System' 
import * as fs from 'fs-extra';
import * as path from 'path';
jest.mock('../src/GeneratedReadme');

describe('generate', () => {
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

    private getPathInReadmeAssets(...paths:string[]):string{
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
      additionalExpectations?:(generateAndWrite:jest.Mock,readmeAssetFolder:ReadmeAssetsFolder)=>Promise<void>|void
      afterFolderCreation?:(readmeAssetFolder:ReadmeAssetsFolder)=>Promise<void>|void
    }
    function createCodeFile(extension:'ts'|'tsx'|'js',isComponent1:boolean):GeneratedFile{
      const component = `Component${isComponent1?'1':'2'}`;
      return {
        contents:`
        module.exports = function(){
        //react.createElement.... ${component}
        }
`,
        fileName:`index.${extension}`
      }
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
    const jsTsComponentFolders:ComponentFolder[] = [
      {
        code:[createCodeFile('js',true),createCodeFile('ts',true)],
        name:'Component1',
        readme:'Component1 read me'
      },
      {
        code:[createCodeFile('js',true),createCodeFile('ts',false)],
        name:'Component2',
        readme:'Component2 read me'
      }
    ]
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
    function getJsTsExpectedAddComponentGeneration(expectTs:boolean,assetsFolder = 'README-assets'){
      const index = expectTs?1:0;
      return [
        {
          codeDetails:{code:(jsTsComponentFolders[0].code as GeneratedFile[])[index].contents,language:'typescript'},
          imageDetails:{
            altText:jsTsComponentFolders[0].name,
            componentImagePath:path.join(assetsFolder,'images',`${jsTsComponentFolders[0].name}.png`)}
        },
        {
          codeDetails:{code:(jsTsComponentFolders[1].code as GeneratedFile[])[index].contents,language:'typescript'},
          imageDetails:{
            altText:jsTsComponentFolders[1].name,
            componentImagePath:path.join(assetsFolder,'images',`${jsTsComponentFolders[1].name}.png`)}
        }
      ]
    }


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
        additionalExpectations:(generateAndWrite:jest.Mock) => {
          expect(generateAndWrite.mock.calls[0][1]).toEqual({some:'launch option'})
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
        additionalExpectations:async (generateAndWrite:jest.Mock,readmeAssetsFolder:ReadmeAssetsFolder) => {
          expect(await fs.pathExists(path.join(readmeAssetsFolder.readmeAssetsFolderFullPath,test.additionalFiles![0].fileName))).toBe(false);
        }
        
      }
      return test;
    })();

    const noPropsIntegrationTests:NoPropsIntegrationTest[] = [
      basicNoPropsTest,
      differentAssetsFolderTest,
      typescriptCodeTest,
      puppetterLaunchOptionsTest,
      cleansImagesTest
      
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
        const generatedReadme = 'GeneratedREADME.md';

        await readmeAssetsFolder.create();
        if(test.afterFolderCreation){
          await test.afterFolderCreation(readmeAssetsFolder);
        }

        async function generateAndExpect(){
          const mockGeneratedReadme= new GeneratedReadme();
          (mockGeneratedReadme.toString as any).mockReturnValue('Fake');

          const generateAndWrite = jest.fn().mockReturnValue(Promise.resolve());
          async function fakeGenerate():Promise<void>{
            const system = new System();
            system.cwd = readmeAssetsFolder.cwd;
            const requirer = {require};
            const reactReadme = new ReactReadme(system,requirer)
            
            const mockPuppeteerImageGenerator:IPuppeteerImageGeneratorWriter = {
              generateAndWrite
            }
            const assetManagerOptions = new AssetManagerOptions(system, reactReadme);
            await assetManagerOptions.init();

            return generate(
              new AssetManager(
                assetManagerOptions, 
                new AssetFolderProvider(
                  system,
                  requirer,
                  reactReadme,
                  new SuffixComponentSorter()
                ),
                system
              ),
              mockGeneratedReadme as any,
              new GeneratedReadmeWriter(system,generatedReadme),
              mockPuppeteerImageGenerator
            );
          }
          

          await fakeGenerate();
          
          
          //expect writes readme
          const generated = await fs.readFile(path.join(readmeAssetsFolder.cwd,generatedReadme),'utf8');
          expect(generated).toBe('Fake');
          
          
          (function expectGeneratedReadme(){
            expect(mockGeneratedReadme.surroundWith).toHaveBeenCalledWith(test.expectedSurroundPre,test.expectedSurroundPost);

            expect(mockGeneratedReadme.addComponentGeneration).toHaveBeenCalledTimes(test.expectedAddComponentGenerations.length);
            const componentFolders = readmeAssetsFolder.componentFolders;
            test.expectedAddComponentGenerations.forEach((expectedAddComponentGeneration,i) => {
              expect(mockGeneratedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(i+1, expectedAddComponentGeneration.codeDetails,componentFolders[i].readme,expectedAddComponentGeneration.imageDetails);
            })
          })();

          if(test.additionalExpectations){
            await test.additionalExpectations(generateAndWrite,readmeAssetsFolder);
          }
        }
        
        await generateAndExpect();
        
      })
      
    })
    
  })
})