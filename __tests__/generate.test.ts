import generate from '../src/generate';
import { Demo } from '../src/interfaces';
import { AssetManager} from '../src/AssetManager';
import { ImageGeneratorFromFile} from '../src/ImageGeneratorFromFile';
import { GeneratedReadme} from '../src/GeneratedReadme';
import { GeneratedReadmeWriter} from '../src/GeneratedReadmeWriter';
import { createInstanceAndChangeMethods, createInstanceAndChangeMethod, create } from '../test-helpers/autoImportHelpers';
jest.mock('../src/AssetManager');
jest.mock('../src/ImageGeneratorFromFile');
jest.mock('../src/GeneratedReadme');
jest.mock('../src/GeneratedReadmeWriter');

const MockAssetManager = AssetManager as jest.MockedClass<typeof AssetManager>;
const MockGeneratedReadmeWriter = GeneratedReadmeWriter as jest.MockedClass<typeof GeneratedReadmeWriter>;
const MockImageGeneratorFromFile = ImageGeneratorFromFile as jest.MockedClass<typeof ImageGeneratorFromFile>;


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
      null as any
    )
    expect(cleanComponentImages).toHaveBeenCalled();
  })
  describe('asset manager component infos', () => {
    it('should get the component infos from the asset manager', async () => {
      const getComponentInfos= jest.fn().mockReturnValue(Promise.resolve([]));
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
        null as any
      )
      expect(getComponentInfos).toHaveBeenCalled();
    })

    describe('for each', () => {
      it('should generate the image from the component folder in the images folder',async () => {
        
        const imageGenerate = jest.fn();
        const componentInfos:Demo[] = [
          {
            name:'First',
            folderPath:'FolderPath1',
            codeDetails:{
              code:'',
              language:''
            },
            readme:''
          },
          {
            name:'Second',
            folderPath:'FolderPath2',
            codeDetails:{
              code:'',
              language:''
            },
            readme:''
          }
        ];
        await generate(
          {
            cleanComponentImages(){},
            readSurroundingReadme(){},
            getComponentInfos(){return Promise.resolve(componentInfos)},
            getComponentImagePath(png:string){
              return `relative/${png}`
            }

          } as any, {
            surroundWith(){},
            addDemo(){}
          } as any,
          {
            write(){},
            getRelativePath(){}
          } as any,
          {
            generate:imageGenerate
          }
        )
        expect(imageGenerate).toHaveBeenNthCalledWith<[string,string]>(1,'FolderPath1','relative/First.png');
        expect(imageGenerate).toHaveBeenNthCalledWith<[string,string]>(2,'FolderPath2','relative/Second.png');
      });

      describe('should be added to the generated read me', () => {
        const componentInfos:Demo[] = [
          {
            codeDetails:{
              code:'code1',
              language:'l1'
            },
            folderPath:'FolderPath1',
            name:'Name1',
            readme:'readme1'
          },
          {
            codeDetails:{
              code:'code2',
              language:'l2'
            },
            folderPath:'FolderPath2',
            name:'Name2',
            readme:'readme2'
          }
        ]
        let generatedReadme:GeneratedReadme
        beforeEach(()=>{
          const getComponentImagePath = jest.fn().mockReturnValueOnce('ImagePath1').mockReturnValueOnce('ImagePath2');
          const assetManager = createInstanceAndChangeMethods(MockAssetManager,
            {
              getComponentInfos:Promise.resolve(componentInfos),
              getComponentImagePath
            }
          );

          generatedReadme = new GeneratedReadme();

          const generatedReadmeWriter = createInstanceAndChangeMethod(
            MockGeneratedReadmeWriter,
            'getRelativePath',
            jest.fn(componentImagePath => `relative/${componentImagePath}`)
          );
          generate(assetManager,generatedReadme,generatedReadmeWriter,create(MockImageGeneratorFromFile));
        })
        it('should add the code details', () => {
          expect(generatedReadme.addDemo).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addDemo']>>(1,componentInfos[0].codeDetails,expect.anything(),expect.anything());
          expect(generatedReadme.addDemo).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addDemo']>>(2,componentInfos[1].codeDetails,expect.anything(),expect.anything());
        })
        it('should add the readme', () => {
          expect(generatedReadme.addDemo).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addDemo']>>(1,componentInfos[0].codeDetails,componentInfos[0].readme,expect.anything());
          expect(generatedReadme.addDemo).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addDemo']>>(2,componentInfos[1].codeDetails,componentInfos[1].readme,expect.anything());
        })
        it('should add the relative component image path', () => {
          expect(generatedReadme.addDemo).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addDemo']>>(1,componentInfos[0].codeDetails,componentInfos[0].readme,expect.objectContaining({componentImagePath:'relative/ImagePath1'}));
          expect(generatedReadme.addDemo).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addDemo']>>(2,componentInfos[1].codeDetails,componentInfos[1].readme,expect.objectContaining({componentImagePath:'relative/ImagePath2'}));
        })
        it('should add the component name as the alt text', () => {
          expect(generatedReadme.addDemo).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addDemo']>>(1,componentInfos[0].codeDetails,componentInfos[0].readme,expect.objectContaining({altText:componentInfos[0].name}));
          expect(generatedReadme.addDemo).toHaveBeenNthCalledWith<Parameters<GeneratedReadme['addDemo']>>(2,componentInfos[1].codeDetails,componentInfos[1].readme,expect.objectContaining({altText:componentInfos[1].name}));
        })
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
      null as any
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
      null as any
    )
    expect(write.mock.calls[0][0]).toBe(generatedReadMe);
  })
});

// create an integration test ?