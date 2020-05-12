import { ReadmeComponentScreenshotOptions, CodeReplacer, } from "../src/asset-management/AssetManager"
import { AssetFolderProvider, IComponentSorter, SortedComponentFolder, IComponentFolderOptionsProvider} from "../src/asset-management/AssetFolderProvider"
import { CodeDetails } from "../src/interfaces";

const noopSorter:IComponentSorter = {
  sort(componentFolderNames:string[]){
    return componentFolderNames.map(componentFolderName => ({
      componentFolderName,
      parsedName:componentFolderName
    }))
  }
}
describe('AssetFolderProvider', () => {
  describe('getComponentInfos', () => {
    it('should contain all registered and own', async () => {
      const assetFolderProvider = new AssetFolderProvider({

      } as any,
      {} as any,
      {} as any,
      noopSorter
      );
      const folder = 'readme-assets';
      const globalOptions = {global:'options'};

      const componentInfo1 = {mock:'rinfo1'};
      const componentInfo2 = {mock:'rinfo2'};
      const componentInfo3 = {mock:'info1'};
      const componentInfo4 = {mock:'info2'};
      const componentInfo5 = {mock:'info3'};
      const componentInfo6 = {mock:'info4'};
      const registered = jest.fn().mockReturnValue([componentInfo1, componentInfo2]);
      const own = jest.fn().mockResolvedValue([[componentInfo3, componentInfo4],[componentInfo5, componentInfo6]]);
      assetFolderProvider['getOwnComponentInfos'] = own;
      assetFolderProvider.registerAssetFolderProviders({
        getComponentInfos:registered
      })
      expect(await assetFolderProvider.getComponentInfos(folder, globalOptions as any)).toEqual([
        componentInfo1,
        componentInfo2,
        componentInfo3,
        componentInfo4,
        componentInfo5,
        componentInfo6
      ]);
      expect(registered).toHaveBeenCalledWith(folder, globalOptions);
    })

    describe('getOwnComponentInfos', () => {
      
      it('should call getComponentInfosForFolder for each sorted component folder in assets', async () => {
        const sortedComponentFolders:Array<SortedComponentFolder> = [
          {
            componentFolderName:'BComponent_1',
            parsedName:'BComponent'
          },
          {
            componentFolderName:'AComponent_2',
            parsedName:'AComponent'
          },
        ]
        const sort = jest.fn().mockReturnValue(sortedComponentFolders);
        const assetFolderProvider = new AssetFolderProvider({
          fs:{
            readdir:()=>Promise.resolve(['AComponent_2', 'BComponent_1'])
          },
          path:{
            join(...paths:string[]){
              return paths.join('/');
            }
          }
        } as any,null as any, null as any,{
          sort
        });
        const componentInfo1 = {mock:'info1'};
        const componentInfo2 = {mock:'info2'};
        const getComponentInfosForFolder = jest.fn().mockResolvedValueOnce([componentInfo1]).mockResolvedValueOnce([componentInfo2]);
        assetFolderProvider['getComponentInfosForFolder'] = getComponentInfosForFolder;

        const res = await assetFolderProvider.getComponentInfos('readme-assets/components',{});

        expect(getComponentInfosForFolder).toHaveBeenCalledWith('readme-assets/components/BComponent_1','BComponent');
        expect(getComponentInfosForFolder).toHaveBeenCalledWith('readme-assets/components/AComponent_2','AComponent');
        expect(res).toEqual([componentInfo1,componentInfo2]);
      });
      
    })
    describe('getComponentInfosForFolder', () => {
      describe('has props', () => {
        


      })
      describe('does not have props -  [ComponentInfo]', () => {
        describe('component readme', () => {
          it('should have read component readme from component folder in props',async () => {
            const readComponentReadMe = jest.fn().mockResolvedValue('some readme');
            const hasProps = jest.fn().mockResolvedValue(false);
            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')}
              }
            } as any, {} as any,{} as any,noopSorter);
            assetFolderProvider['hasProps'] = hasProps;
            assetFolderProvider['getMergedOptions']=()=>Promise.resolve({});
            assetFolderProvider.readComponentReadMe = readComponentReadMe;
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
            assetFolderProvider.getComponentScreenshot = () => ({}) as any;
            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
            expect(hasProps).toHaveBeenCalledWith(componentAssetFolderPath);
            expect(readComponentReadMe).toHaveBeenCalledWith(componentAssetFolderPath);
            expect(componentInfos.length).toBe(1);
            expect(componentInfos[0].readme).toBe('some readme');
          })
          describe('readComponentReadMe', () => {
            it('should read README.md if it exists', async () => {
             const exists=jest.fn().mockResolvedValue(true);
             const readFileString = jest.fn().mockResolvedValue('some read me');
             const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
                path:{
                  join(...paths:string[]){
                    return paths.join('/');
                  },
                  exists
                },
                fs:{
                  readFileString
                }
              } as any,{
                require
              },{} as any,noopSorter);
              const componentReadme = await assetFolderProvider.readComponentReadMe('readme-assets/components/Component');
              expect(componentReadme).toEqual('some read me');
              [exists, readFileString].forEach(mock => {
                expect(mock).toHaveBeenCalledWith('readme-assets/components/Component/README.md');
              })
            })
            it('should return empty string if README.md does not exist',async () => {
              const exists=jest.fn().mockResolvedValue(false);
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
                  path:{
                    join(...paths:string[]){
                      return paths.join('/');
                    },
                    exists
                  }
                } as any,{
                  require
                },{} as any,noopSorter);
                const componentReadme = await assetFolderProvider.readComponentReadMe('readme-assets/components/Component');
                expect(componentReadme).toEqual('');
            })
          })
        })

        describe('screenshot options', () => {
          it('should have property determined by the component path and merged screenshot options', async () => {
            const componentScreenshot = {
              some:'prop'
            }
            const getComponentScreenshot = jest.fn().mockReturnValue(componentScreenshot)
            const hasProps = jest.fn().mockResolvedValue(false);
            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')}
              }
            } as any, {} as any,{} as any,noopSorter);
            assetFolderProvider['hasProps'] = hasProps;
            const mergedOptions = {
              screenshotOptions:{
                mock:'property'
              }
            }
            assetFolderProvider['getMergedOptions']=()=>Promise.resolve(mergedOptions as any);
            assetFolderProvider.readComponentReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
            assetFolderProvider.getComponentScreenshot = getComponentScreenshot;
            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
            expect(componentInfos[0].componentScreenshot).toBe(componentScreenshot);
            expect(getComponentScreenshot).toHaveBeenCalledWith('readme-assets/components/Component/index.js',mergedOptions.screenshotOptions);
          })
          describe('getComponentScreenshot', () => {
            it('should require the default export and merge in export property with the component options', () => {
              const component = function SomeComponent(){};
              const require = jest.fn().mockReturnValue({exportProperty:component});
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
                path:{
                  join(...paths:string[]){
                    return paths.join('/');
                  }
                }
              } as any,{
                require
              } as any,{} as any,noopSorter)
              const readmeComponentScreenshotOptions:ReadmeComponentScreenshotOptions = {
                css:'css',
                height:1,
                props:{
                  p1:'v1',
                },
                type:'jpeg',
                webfont:'webfont',
                width:1
        
              }
              const screenshotOptions = assetFolderProvider.getComponentScreenshot('readme-assets/Component/index.js',readmeComponentScreenshotOptions,'exportProperty');
              expect(require).toHaveBeenCalledWith('readme-assets/Component/index.js');
              expect(screenshotOptions).toEqual({Component:component,...readmeComponentScreenshotOptions})
            })
          });
        })

        describe('component code', () => {
          it('should have the component code in properties', async () => {
            const componentCode:CodeDetails = {code:'some code',language:'language'}
            const getComponentCode=jest.fn().mockResolvedValue(componentCode);
            const hasProps = jest.fn().mockResolvedValue(false);
            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')}
              }
            } as any, {} as any,{} as any,noopSorter);
            assetFolderProvider['hasProps'] = hasProps;
            const mergedOptions = {
              codeReplacer:()=>{},
              codeInReadme:'Js'
            }
            assetFolderProvider['getMergedOptions']=()=>Promise.resolve(mergedOptions as any);
            assetFolderProvider.readComponentReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=getComponentCode;
            assetFolderProvider.getComponentScreenshot = ()=>({} as any);
            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
            expect(componentInfos[0].codeDetails).toEqual(componentCode);
            expect(getComponentCode).toHaveBeenCalledWith('readme-assets/components/Component/index.js',mergedOptions.codeInReadme,mergedOptions.codeReplacer);
          })

          describe('getComponentCode', () => {
            it('should return empty code and language if codeInReadme is None',async () => {
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider(null as any,null as any,{} as any,noopSorter);
              const componentCode = await assetFolderProvider.getComponentCode('readme-assets/components/Component', 'None',null as any);
              expect(componentCode).toEqual({code:'',language:''})
            })
        
            it('should readUntilExists index.js if codeInReadMe is Js and replace', async () => {
              const codeReplacer = jest.fn().mockReturnValue('replaced');
              const readUntilExists = jest.fn().mockResolvedValue({
                didRead:true,
                read:'some js',
                readPath:'readme-assets/components/Component/index.js'
              });
              const extname = jest.fn().mockReturnValue('.js')
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
                path:{
                  join(...paths:string[]){
                    return paths.join('/');
                  },
                  extname
                },
                fs:{
                  readUntilExists
                }
              } as any,null as any,
              {} as any,noopSorter);
              const componentCode = await assetFolderProvider.getComponentCode('readme-assets/components/Component/index.js', 'Js',codeReplacer);
              expect(componentCode).toEqual({code:'replaced',language:'javascript'});
              expect(readUntilExists).toHaveBeenCalledWith('readme-assets/components/Component/index.js');
              expect(codeReplacer).toHaveBeenCalledWith('some js');
              expect(extname).toHaveBeenCalledWith('readme-assets/components/Component/index.js');
              
        
            });
        
            it('should throw error if code is not found', () =>  {
              const codeReplacer = jest.fn().mockReturnValue('replaced');
              const readUntilExists = jest.fn().mockResolvedValue({
                didRead:false,
              });
              const extname = jest.fn().mockReturnValue('.js')
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
                path:{
                  join(...paths:string[]){
                    return paths.join('/');
                  },
                  extname
                },
                fs:{
                  readUntilExists
                }
              } as any,null as any,{} as any,noopSorter);
        
              return expect(assetFolderProvider.getComponentCode('readme-assets/components/Component/index.js', 'Js',codeReplacer)).rejects.toThrow('no component file found');
            })
           
            it('should readUntilExists with preference order ts, tsx, js if codeInReadMe is not Js and replace', async() => {
              const codeReplacer = jest.fn().mockReturnValue('replaced');
              const readUntilExists = jest.fn().mockResolvedValue({
                didRead:true,
                read:'some ts',
                readPath:'readme-assets/components/Component/component.ts'
              });
              const extname = jest.fn().mockReturnValue('.ts')
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
                path:{
                  join(...paths:string[]){
                    return paths.join('/');
                  },
                  extname
                },
                fs:{
                  readUntilExists
                }
              } as any,null as any, {} as any,noopSorter);
              const componentCode = await assetFolderProvider.getComponentCode('readme-assets/components/Component/component.js', undefined,codeReplacer);
              expect(componentCode).toEqual({code:'replaced',language:'typescript'});
              expect(codeReplacer).toHaveBeenCalledWith('some ts');
              expect(extname).toHaveBeenCalledWith('readme-assets/components/Component/component.ts');
              expect(readUntilExists).toHaveBeenCalledWith('readme-assets/components/Component/component.ts','readme-assets/components/Component/component.tsx','readme-assets/components/Component/component.js');
            })

            describe('code replacement', () => {
              interface CodeReplacementTest{
                description:string,
                codeReplacer:CodeReplacer,
                expectedReplacedCode:string
              }
              const tests:CodeReplacementTest[] = [
                {
                  description:'string replace',
                  codeReplacer:{
                    regex:/can be/,
                    replace:'should have been'
                  },
                  expectedReplacedCode:'This should have been replaced'
                },
                {
                  description:'function replace',
                  codeReplacer: code => code + ' and it was',
                  expectedReplacedCode:'This can be replaced and it was'
                },

              ]
              tests.forEach(test => {
                it(`${test.description}`, async () => {
                  const readUntilExists = jest.fn().mockResolvedValue({
                    didRead:true,
                    read:'This can be replaced',
                    readPath:'readme-assets/components/Component/component.ts'
                  });
                  const extname = jest.fn().mockReturnValue('.ts')
                  const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
                    path:{
                      join(...paths:string[]){
                        return paths.join('/');
                      },
                      extname
                    },
                    fs:{
                      readUntilExists
                    }
                  } as any,null as any, {} as any,noopSorter);
                  const componentCode = await assetFolderProvider.getComponentCode('readme-assets/components/Component/component.js', undefined,test.codeReplacer);
                  expect(componentCode.code).toBe(test.expectedReplacedCode);
                })
              })
              
              
            })
          })
        })

        it('should merge options from the provider with the global options', async () => {
          const optionsProvider:IComponentFolderOptionsProvider = {
            getOptions(path){
              return Promise.resolve({
                aFolderOption:'',
                codeInReadme:'Js'
              } as any)
            }
          }
          const assetFolderProvider = new AssetFolderProvider({
            fs:{
              readdir:()=>Promise.resolve(['Component'])
            },
            path:{
              join(...paths:string[]){
                return paths.join('/');
              }
            }
          } as any,
          undefined as any,
          optionsProvider,
          {
            sort:(folderNames:string[])=>[{componentFolderName:'',parsedName:''}]
          }
          );

          assetFolderProvider.getComponentScreenshot = ()=> ({} as any);
          assetFolderProvider['hasProps'] =()=>Promise.resolve(true);
          const generateComponentInfosForProps = jest.fn().mockResolvedValue([]);
          assetFolderProvider['generateComponentInfosForProps'] = generateComponentInfosForProps

          const globalCodeReplacer:CodeReplacer = code => code;
          await assetFolderProvider.getComponentInfos('',{codeInReadme:'None',codeReplacer:globalCodeReplacer});
          expect(generateComponentInfosForProps.mock.calls[0][1]).toEqual({aFolderOption:'',codeReplacer:globalCodeReplacer,codeInReadme:'Js'})
        })
      })
        
      describe('component path in options', () => {
        interface ComponentPathOptionsTest{
          isAbsolute:boolean,

          expectedPath:string

        }
        const tests:ComponentPathOptionsTest[] = [
          {
            isAbsolute:true,
            expectedPath:'pathToComponent.js'
          },
          {
            isAbsolute:false,
            expectedPath:'readme-assets/components/Component/pathToComponent.js'
          }
        ]
        tests.forEach(test => {
          it(`${test.isAbsolute?'should use absolute for getComponentCode and getComponentScreenshot':'should be relative to component folder if not absolute'}`, async () => {
            const getComponentCode = jest.fn().mockResolvedValue('');
            const getComponentScreenshot = jest.fn().mockResolvedValue('');
            const isAbsolute=jest.fn().mockReturnValue(test.isAbsolute)
            const hasProps = jest.fn().mockResolvedValue(false);
            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')},
                isAbsolute
              }
            } as any, {} as any,{} as any,noopSorter);
            assetFolderProvider['hasProps'] = hasProps;
            const mergedOptions = {
              componentPath:'pathToComponent.js'
            }
            assetFolderProvider['getMergedOptions']=()=>Promise.resolve(mergedOptions as any);
            assetFolderProvider.readComponentReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=getComponentCode;
            assetFolderProvider.getComponentScreenshot = getComponentScreenshot;
            const componentAssetFolderPath = 'readme-assets/components/Component';

            await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
            expect(getComponentCode.mock.calls[0][0]).toBe(test.expectedPath);
            expect(getComponentScreenshot.mock.calls[0][0]).toBe(test.expectedPath);
          })
        })
      })
    })
  })
})
  