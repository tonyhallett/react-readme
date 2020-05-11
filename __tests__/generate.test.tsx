import React from 'react';
import generate from '../src/generate';
import { ComponentInfo } from '../src/interfaces';
import { AssetManager} from '../src/asset-management/AssetManager';
import { PuppeteerImageGeneratorWriter} from '../src/PuppeteerImageGeneratorWriter';
import { GeneratedReadme} from '../src/GeneratedReadme';
import { GeneratedReadmeWriter} from '../src/GeneratedReadmeWriter';
import { createInstanceAndChangeMethods, createInstanceAndChangeMethod, create } from '../test-helpers/autoImportHelpers';
jest.mock('../src/asset-management/AssetManager');
jest.mock('../src/PuppeteerImageGeneratorWriter');
jest.mock('../src/GeneratedReadme');
jest.mock('../src/GeneratedReadmeWriter');

const MockAssetManager = AssetManager as jest.MockedClass<typeof AssetManager>;
const MockGeneratedReadmeWriter = GeneratedReadmeWriter as jest.MockedClass<typeof GeneratedReadmeWriter>;
const MockPuppeteerImageGeneratorWriter = PuppeteerImageGeneratorWriter as jest.MockedClass<typeof PuppeteerImageGeneratorWriter>;
const MockGeneratedReadme = GeneratedReadme as jest.MockedClass<typeof GeneratedReadme>;
describe('generate', () => {
  it('should clean component images',async () => {
    const cleanComponentImages= jest.fn();
    await generate(
      {
        getComponentInfos(){
          return Promise.resolve([]);
        },
        readSurroundingReadme(){},
        cleanComponentImages
      } as any, {
        surroundWith(){},
      } as any,
      {
        write(){}
      } as any,
      {
        generateAndWrite:()=>Promise.resolve()
      }
    )
    expect(cleanComponentImages).toHaveBeenCalled();
  })
  describe('asset manager component infos', () => {
    it('should get the component infos from the asset manager', async () => {
      const getComponentInfos= jest.fn().mockResolvedValue([]);
      await generate(
        {
          cleanComponentImages(){},
          readSurroundingReadme(){},
          getComponentInfos
        } as any, {
          surroundWith(){},
        } as any,
        {
          write(){}
        } as any,
        {
          generateAndWrite:()=>Promise.resolve()
        }
      )
      expect(getComponentInfos).toHaveBeenCalled();
    })
    it('should generate and write the images folder',async () => {
      const puppeteerLaunchOptions = {} as any;
      const generateAndWrite = jest.fn();
      
      const componentInfos:ComponentInfo[] = [
        {
          name:'First',
          codeDetails:{
            code:'',
            language:''
          },
          readme:'',
          componentScreenshot:{
            Component:function(){return <span></span>},
            css:'css1',
            height:1,
            width:1,
            props:{
              p1:'1'
            },
            type:'jpeg',
            webfont:'webfont1'
          }
        },
        {
          name:'Second',
          codeDetails:{
            code:'',
            language:''
          },
          readme:'',
          componentScreenshot:{
            Component:function(){return <div></div>},
            css:'css2',
            height:2,
            width:2,
            props:{
              p2:'2'
            },
            webfont:'webfont2'
          }
        }
      ];
      await generate(
        {
          cleanComponentImages(){},
          readSurroundingReadme(){},
          getComponentInfos(){return Promise.resolve(componentInfos)},
          getComponentImagePath(png:string){
            return `relative/${png}`
          },
          puppeteerLaunchOptions

        } as any, {
          surroundWith(){},
          addComponentGeneration(){}
        } as any,
        {
          write(){},
          getRelativePath(){}
        } as any,
        {
          generateAndWrite
        }
      )
      expect(generateAndWrite).toHaveBeenCalledWith([
        {...componentInfos[0].componentScreenshot,id:'relative/First.jpeg'},
        {...componentInfos[1].componentScreenshot,id:'relative/Second.png'}
      ],puppeteerLaunchOptions);
    });

    describe('should be added to the generated read me', () => {
      const componentInfos:ComponentInfo[] = [
        {
          codeDetails:{
            code:'code1',
            language:'l1'
          },
          name:'Name1',
          readme:'readme1',
          componentScreenshot:{
            type:'jpeg'
          } as any
        },
        {
          codeDetails:{
            code:'code2',
            language:'l2'
          },
          name:'Name2',
          readme:'readme2',
          componentScreenshot:{

          } as any
        }
      ]
      let generatedReadme:GeneratedReadme
      beforeEach(async ()=>{
        const assetManager = create(MockAssetManager);
        assetManager.getComponentInfos = jest.fn().mockResolvedValue(componentInfos);
        assetManager.getComponentImagePath = jest.fn(image => `readme-assets/images/${image}`);
        
        generatedReadme = create(MockGeneratedReadme);

        const generatedReadmeWriter = createInstanceAndChangeMethod(
          MockGeneratedReadmeWriter,
          'getRelativePath',
          jest.fn(componentImagePath => `relative/${componentImagePath}`)
        );
        await generate(assetManager as any,generatedReadme,generatedReadmeWriter,create(MockPuppeteerImageGeneratorWriter));
      })
      it('should add the code details', () => {
        expect(generatedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(1,componentInfos[0].codeDetails,expect.anything(),expect.anything());
        expect(generatedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(2,componentInfos[1].codeDetails,expect.anything(),expect.anything());
      })
      it('should add the readme', () => {
        expect(generatedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(1,componentInfos[0].codeDetails,componentInfos[0].readme,expect.anything());
        expect(generatedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(2,componentInfos[1].codeDetails,componentInfos[1].readme,expect.anything());
      })
      it('should add the relative component image path', () => {
        expect(generatedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(1,componentInfos[0].codeDetails,componentInfos[0].readme,expect.objectContaining({componentImagePath:'relative/readme-assets/images/Name1.jpeg'}));
        expect(generatedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(2,componentInfos[1].codeDetails,componentInfos[1].readme,expect.objectContaining({componentImagePath:'relative/readme-assets/images/Name2.png'}));
      })
      it('should add the component name as the alt text', () => {
        expect(generatedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(1,componentInfos[0].codeDetails,componentInfos[0].readme,expect.objectContaining({altText:componentInfos[0].name}));
        expect(generatedReadme.addComponentGeneration).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addComponentGeneration']>>(2,componentInfos[1].codeDetails,componentInfos[1].readme,expect.objectContaining({altText:componentInfos[1].name}));
      })
    })
    
  })
  
  it('should surround the generated readme with pre and post readme', async () => {
    const surroundWith = jest.fn();
    await generate(
      {
        cleanComponentImages(){},
        readSurroundingReadme(pre:boolean){
          return pre?'Pre':'Post';
        },
        getComponentInfos(){return Promise.resolve([])}
      } as any, {
        surroundWith
      } as any,
      {
        write(){}
      } as any,
      {
        generateAndWrite:()=>Promise.resolve()
      }
    )
    expect(surroundWith).toHaveBeenCalledWith('Pre','Post');
  })
  it('should write the generated read me', async () => {
    const write= jest.fn();
    const generatedReadMe = {
      surroundWith(){},
    }
    await generate(
      {
        cleanComponentImages(){},
        readSurroundingReadme(){},
        getComponentInfos(){return Promise.resolve([])}
      } as any, 
      generatedReadMe as any,
      {
        write
      } as any,
      {
        generateAndWrite:()=>Promise.resolve()
      }
    )
    expect(write.mock.calls[0][0]).toBe(generatedReadMe);
  })
});
