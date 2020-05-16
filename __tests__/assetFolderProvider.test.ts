import { CodeReplacer, ComponentOptions, CodeInReadme, } from "../src/asset-management/AssetManager"
import { AssetFolderProvider, IComponentSorter, SortedComponentFolder, IComponentFolderOptionsProvider} from "../src/asset-management/AssetFolderProvider"
import { CodeDetails } from "../src/interfaces";
import { LanguageReaderResult } from "../src/asset-management/LanguageReader";

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
      noopSorter,
      {} as any
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
        },{} as any);
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
            const assetFolderProvider = new AssetFolderProvider(
              {
                path:{
                  join(...paths:string[]){return paths.join('/')}
                }
              } as any,
              {} as any,
              {
                getOptions:()=>Promise.resolve({})
              } as any,
              noopSorter,
              {} as any
            );
            assetFolderProvider['hasProps'] = hasProps;
            assetFolderProvider['getMergedOptions']=()=>({});
            assetFolderProvider.readComponentReadMe = readComponentReadMe;
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
            assetFolderProvider['getComponentByPath'] = () => null as any;

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
              },{} as any,noopSorter,{} as any);
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
                },{} as any,noopSorter,{} as any);
                const componentReadme = await assetFolderProvider.readComponentReadMe('readme-assets/components/Component');
                expect(componentReadme).toEqual('');
            })
          })
        })

        describe('screenshot options', () => {
          it('should have property containing merged screenshot options', async () => {
            const component = function(){} as any
            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')}
              }
            } as any, {} as any,{
              getOptions:()=>Promise.resolve({
                component
              } as ComponentOptions)
            } as any,noopSorter,{} as any);
            assetFolderProvider['hasProps'] = () => Promise.resolve(false);
            const mergedOptions = {
              screenshotOptions:{
                type:'jpeg'
              },
            }
            assetFolderProvider['getMergedOptions']=()=>mergedOptions as any;
            assetFolderProvider.readComponentReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);

            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
            
            expect(componentInfos[0].componentScreenshot).toEqual(expect.objectContaining(mergedOptions.screenshotOptions));
          })
          it('should have the component from options if present', async () => {
            const component = function(){} as any
            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')}
              }
            } as any, {} as any,{
              getOptions:()=>Promise.resolve({
                component
              })
            } as any,noopSorter,{} as any);
            assetFolderProvider['hasProps'] = () => Promise.resolve(false);
            const mergedOptions = {
              screenshotOptions:{
                type:'jpeg'
              },
            }
            assetFolderProvider['getMergedOptions']=()=>mergedOptions as any;
            assetFolderProvider.readComponentReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);

            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
            
            expect(componentInfos[0].componentScreenshot).toEqual({type:'jpeg',Component:component});
          })
          describe('component not on options', () => {
            it('should getComponentByPath', async () => {
              const assetFolderProvider = new AssetFolderProvider({
                path:{
                  join(...paths:string[]){return paths.join('/')}
                }
              } as any, {} as any,{
                getOptions:()=>Promise.resolve({})
              } as any,noopSorter,{} as any);
              assetFolderProvider['hasProps'] = () => Promise.resolve(false);
              const mergedOptions = {
                screenshotOptions:{
                  type:'jpeg'
                },
              }
              assetFolderProvider['getMergedOptions']=()=>mergedOptions as any;
              assetFolderProvider.readComponentReadMe = () => Promise.resolve({} as any);
              assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
              const componentByPath = ()=>({}) as any;
              assetFolderProvider.getComponentByPath = () => componentByPath;
  
              const componentAssetFolderPath = 'readme-assets/components/Component';
              const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
              
              expect(componentInfos[0].componentScreenshot).toEqual({type:'jpeg',Component:componentByPath});
            })
            describe('getComponentByPath should require the component using the path', () => {
              const component = function SomeComponent(){};
              const componentPath = 'readme-assets/Component/index.js';
              let componentResult:React.ComponentType
              let mockRequire:jest.Mock
              function getComponentByPath(requireResult:any,key?:string){
                mockRequire = jest.fn().mockReturnValue(requireResult);
                const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
                  path:{
                    join(...paths:string[]){
                      return paths.join('/');
                    }
                  }
                } as any,{
                  require:mockRequire
                } as any,{} as any,noopSorter,{} as any)
                
                componentResult = assetFolderProvider.getComponentByPath('readme-assets/Component/index.js',key);
              }
              describe('the different module exports ', () => {
                interface GetComponentScreenshotTest{
                  description:string
                  requireResult:object,
                  key?:string
                }
                const tests:GetComponentScreenshotTest[] = [
                  {
                    description:'exports =',
                    requireResult:component
                  },
                  {
                    description:'exports default',
                    requireResult:{default:component}
                  },
                  {
                    description:'exports property',
                    requireResult:{someKey:component,default:''},
                    key:'someKey'
                  },
                ];
                
                tests.forEach(test => {
                  it(test.description, () => {
                    getComponentByPath(test.requireResult,test.key);
                    expect(mockRequire).toHaveBeenCalledWith(componentPath);
                    expect(componentResult).toEqual(component);
                  })
                })
              })
              it('should throw error if Component cannot be required', () => {
                expect(()=>getComponentByPath(undefined)).toThrowError('Cannot find component at path: ' + componentPath)
              })
            })
          })
        });
        
        describe('component code', () => {
          it('should have the component code in properties', async () => {
            const componentCode:CodeDetails = {code:'some code',language:'language'}
            const getComponentCode=jest.fn().mockResolvedValue(componentCode);

            const hasProps = jest.fn().mockResolvedValue(false);
            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')}
              }
            } as any, {} as any,{
              getOptions:()=>Promise.resolve({})
            } as any,noopSorter,{} as any);
            assetFolderProvider['hasProps'] = hasProps;
            const mergedOptions = {
              codeReplacer:()=>{},
              codeInReadme:'Js'
            }
            assetFolderProvider['getMergedOptions']=()=>mergedOptions as any;
            assetFolderProvider.readComponentReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=getComponentCode;
            assetFolderProvider.getComponentByPath = () => null as any;
            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
            
            expect(componentInfos[0].codeDetails).toEqual(componentCode);
          })
          describe('getting the component code', () => {
            it('should return empty if mergedOptions.codeInReadme is None', async () => {
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider(null as any,null as any,{} as any,noopSorter,{} as any);
              const componentCode = await assetFolderProvider.getComponentCode(null as any, 'None',null as any);
              expect(componentCode).toEqual({code:'',language:''})
            })
            describe('it should call the code replacer if mergedOptions.codeInReadme is not None', () => {
              interface CodeProviderTest{
                codeInReadme:Exclude<CodeInReadme,'None'>|undefined,
                expectedCodeProviderIsJs:boolean
              }
              const tests:CodeProviderTest[] = [
                {
                  codeInReadme:undefined,
                  expectedCodeProviderIsJs:false
                },
                {
                  codeInReadme:'Js',
                  expectedCodeProviderIsJs:true
                }
              ];
              tests.forEach( test => {
                const description = test.codeInReadme?'js':'default ts'
                it(description, async () => {
                  const codeProvider = jest.fn().mockReturnValue({code:'',language:''})
                  const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider(null as any,null as any,{} as any,noopSorter,{} as any);
                  await assetFolderProvider.getComponentCode(codeProvider, test.codeInReadme,undefined);
                  expect(codeProvider).toHaveBeenCalledWith(test.expectedCodeProviderIsJs);
                })
              })

            })
            describe('replacing the provided code', () => {
              it('should be replaced', async () => {
                const codeProvider = jest.fn().mockReturnValue({code:'some code ',language:'language'})
                const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider(null as any,null as any,{} as any,noopSorter,{} as any);
                assetFolderProvider['getCodeReplacer'] = () => code => code + 'replaced';
                const componentCode = await assetFolderProvider.getComponentCode(codeProvider, undefined, undefined);
                expect(componentCode).toEqual<CodeDetails>({code:'some code replaced',language:'language'});
              })
              describe('code replacer', () => {
                interface CodeReplacementTest{
                  description:string,
                  codeReplacer:CodeReplacer|undefined,
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
                  {
                    description:'undefined, no replacement',
                    codeReplacer:undefined,
                    expectedReplacedCode:'This can be replaced'
                  },
  
                ]
                tests.forEach(test => {
                  it(`${test.description}`, async () => {
                    const codeProvider = jest.fn().mockReturnValue({code:'This can be replaced',language:'language'})
                    const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider(null as any,null as any,{} as any,noopSorter,{} as any);
                    const componentCode = await assetFolderProvider.getComponentCode(codeProvider, undefined, test.codeReplacer);
                    expect(componentCode.code).toBe(test.expectedReplacedCode);
                  })
                })
              })
            })
            describe('the chosen code provider', () => {
              const componentAssetFolderPath = 'readme-assets/components/Component';
              interface CodeProviderTest{
                description:string,
                optionsComponent?:any,
                optionsComponentPath?:string,
                expectedReadCode:boolean,
                expectedFirstArg:string
              }
              const tests:CodeProviderTest[] = [
                {
                  description:'no component, no path',
                  expectedReadCode:true,
                  expectedFirstArg:expect.anything() as any, // componentPath already covered in previous test
                },
                {
                  description:'options component',
                  optionsComponent:function(){},
                  expectedReadCode:false,
                  expectedFirstArg:componentAssetFolderPath
                },
                {
                  description:'options component and path',
                  optionsComponent:function(){},
                  optionsComponentPath:'the path',
                  expectedReadCode:true,
                  expectedFirstArg:expect.anything() as any // componentPath already covered in previous test
                }
              ];
              tests.forEach(test => {
                it(test.description, async() => {
                  const optionsProviderGetComponentCode = jest.fn().mockReturnValue({code:'', language:''} as CodeDetails);
                  const readComponentCode = jest.fn().mockReturnValue({code:'', language:''} as CodeDetails);

                  const options = { } as ComponentOptions;
                  if(test.optionsComponent){
                    options.component = test.optionsComponent;
                  }
                  if(test.optionsComponentPath){
                    options.componentPath = test.optionsComponentPath;
                  }

                  const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider(
                    {
                      path:{
                        join(...paths:string[]){
                          return paths.join('/')
                        }
                      }
                    } as any,
                    null as any,
                    {
                      getOptions:()=>Promise.resolve(options),
                      getComponentCode:optionsProviderGetComponentCode
                    } as any,
                    noopSorter,{} as any);

                  assetFolderProvider['hasProps'] = () => Promise.resolve(false);
                  
                 

                  assetFolderProvider['getMergedOptions']=()=>({});
                  assetFolderProvider['getAbsolutePathToJs'] = () => '';
                  assetFolderProvider['readComponentCode'] = readComponentCode;
                  assetFolderProvider['readComponentReadMe'] = () => Promise.resolve('');
                  assetFolderProvider['getComponentByPath'] = () => ({} as any)
      
                  
                  await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
                  
                  const expectedProvider = test.expectedReadCode? readComponentCode: optionsProviderGetComponentCode;
                  expect(expectedProvider).toHaveBeenCalledWith(test.expectedFirstArg,false);
                })
              })
            })
          })
          describe('readComponentCode', () => {
            it('should use the language reader', async () => {
              const readResult:LanguageReaderResult = {code:'code',language:'typescript', readPath:'path'};
              const languageReaderRead = jest.fn().mockReturnValue(readResult);
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
              } as any,null as any,
              {} as any,noopSorter,{
                read:languageReaderRead
              } as any);
              const componentCode = await assetFolderProvider['readComponentCode']('readme-assets/components/Component/index.js', true);
              
              expect(componentCode).toEqual<CodeDetails>({code:'code',language:'typescript'});
            })
            
        
            it('should throw error if code is not found', async() =>  {
              const languageReaderRead = jest.fn().mockReturnValue(undefined);
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider({
              } as any,null as any,
              {} as any,noopSorter,{
                read:languageReaderRead
              } as any);
              
              return expect(assetFolderProvider['readComponentCode']('readme-assets/components/Component/index.js', true)).rejects.toThrow('no component file found');
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
            },
            getComponentCode:()=>Promise.resolve(null as any)
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
          },{} as any
          );

          assetFolderProvider['hasProps'] =()=>Promise.resolve(true);
          const generateComponentInfosForProps = jest.fn().mockResolvedValue([]);
          assetFolderProvider['generateComponentInfosForProps'] = generateComponentInfosForProps

          const globalCodeReplacer:CodeReplacer = code => code;
          await assetFolderProvider.getComponentInfos('',{codeInReadme:'None',codeReplacer:globalCodeReplacer});
          expect(generateComponentInfosForProps.mock.calls[0][1]).toEqual({aFolderOption:'',codeReplacer:globalCodeReplacer,codeInReadme:'Js'})
        })
      })
        
      describe('component path', () => {
        const componentAssetFolderPath = 'readme-assets/components/Component';
        const mergedOptionsComponentPath = 'mergedOptions/componentpath';
        interface ComponentPathTest{
          description:string,
          mergedOptionsComponentPath?:string,
          isAbsolute?:boolean,
          expectedComponentPath:string
        }
        const tests:ComponentPathTest[] = [
          {
            description:'index.js',
            expectedComponentPath:`${componentAssetFolderPath}/index.js`
          },
          {
            description:'absolute merged options component path',
            isAbsolute:true,
            expectedComponentPath:mergedOptionsComponentPath
          },
          {
            description:'relative ( joined ) merged options component path to the component asset folder ',
            isAbsolute:false,
            expectedComponentPath:`${componentAssetFolderPath}/${mergedOptionsComponentPath}`
          }
        ]
        tests.forEach(test => {
          it(test.description, async () => {
            const readComponentCode = jest.fn().mockResolvedValue('');
            const getComponentByPath = jest.fn().mockResolvedValue('');

            const hasProps = jest.fn().mockResolvedValue(false);

            const options = {
            } as ComponentOptions;
            if(test.isAbsolute!==undefined){
              options.componentPath=mergedOptionsComponentPath;
            }

            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')},
                isAbsolute:()=>test.isAbsolute
              }
            } as any, {} as any,{
              getOptions:()=>Promise.resolve(options)
            } as any,noopSorter,{} as any);
            assetFolderProvider['hasProps'] = hasProps;

            
            assetFolderProvider['getMergedOptions']=()=>({});

            assetFolderProvider.readComponentReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentByPath = getComponentByPath;
            assetFolderProvider['readComponentCode'] = readComponentCode;

            await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component');
            
            expect(readComponentCode.mock.calls[0][0]).toBe(test.expectedComponentPath);
            expect(getComponentByPath.mock.calls[0][0]).toBe(test.expectedComponentPath);
          })
        })
      })
    })
  })
})
  