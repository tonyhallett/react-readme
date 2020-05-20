import { CodeReplacer, ComponentOptions, CodeInReadme, ComponentOptionsCommon, ComponentOptionsProps, PropsOrPropsWithOptions, Props, PropsOptions, GlobalComponentOptions, ComponentInfoSeparators, } from "../src/asset-management/AssetManager"
import { AssetFolderProvider, IComponentSorter, SortedComponentFolder, IComponentFolderOptionsProvider, ComponentOptionsWithProps, PropsAndOptions, ComponentComponentInfo, PropsCodeDetails} from "../src/asset-management/AssetFolderProvider"
import { CodeDetails, ComponentInfo } from "../src/interfaces";
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
      expect(await assetFolderProvider.getComponentInfos(folder, globalOptions as any,undefined)).toEqual([
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

        const res = await assetFolderProvider.getComponentInfos('readme-assets/components',{},undefined);

        expect(getComponentInfosForFolder).toHaveBeenCalledWith('readme-assets/components/BComponent_1','BComponent',true,undefined);
        expect(getComponentInfosForFolder).toHaveBeenCalledWith('readme-assets/components/AComponent_2','AComponent',false,undefined);
        expect(res).toEqual([componentInfo1,componentInfo2]);
      });
      
    })
    describe('getComponentInfosForFolder', () => {
      describe('separators', () => {
        describe('first component should not have a separator', () => {
          it('should not have a separator when no props',async () => {
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
            
            assetFolderProvider['getMergedOptions']=()=>({});
            assetFolderProvider.readReadMe = ()=>Promise.resolve('some readme');
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
            assetFolderProvider['getComponentByPath'] = () => null as any;

            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,{componentSeparator:'----'});
            
            expect(componentInfos[0].readme).toBe('some readme');
          })
          it.skip('should not have a separator when props', () => {

          })
          //need to do props and not props
          //will need to set up so that the separator is present
        })
        describe('second component can have a ComponentPropsSeparator or ComponentSeparator', () => {
          interface SecondComponentTest{
            description:string,
            separators?:ComponentInfoSeparators,
            readme?:string,
            expectedReadme:string|undefined,
          }
          describe('no props', () => {
            
            const tests:SecondComponentTest[] = [
              {
                readme:'readme',
                separators:{
                  componentSeparator:'-'
                },
                expectedReadme:'-readme',
                description:'prepends component separator to readme'
              },
              {
                separators:{
                  componentSeparator:'-'
                },
                expectedReadme:'-',
                description:'separates when no readme'
              },
              {
                readme:'readme',
                expectedReadme:'readme',
                description:'no component separator'
              },
              {
                expectedReadme:undefined,
                description:'no component separator, no readme',
                separators:{
                  componentPropsSeparator:'-'
                }
              }
            ];
  
            tests.forEach(test => {
              it(test.description,async () => {
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
                
                assetFolderProvider['getMergedOptions']=()=>({});
                assetFolderProvider.readReadMe = ()=>Promise.resolve(test.readme);
                assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
                assetFolderProvider['getComponentByPath'] = () => null as any;
    
                const componentAssetFolderPath = 'readme-assets/components/Component';
                const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',false,test.separators);
                
                expect(componentInfos[0].readme).toBe(test.expectedReadme);
              })
            })
          })
          describe('props', () => {
            const tests:SecondComponentTest[]=[
              {
                readme:'readme',
                description:'component props preference',
                separators:{
                  componentSeparator:'C',
                  componentPropsSeparator:'P'
                },
                expectedReadme:'Preadme'
              },
              {
                readme:'readme',
                description:'component separator fallback',
                separators:{
                  componentSeparator:'C',
                },
                expectedReadme:'Creadme'
              },
              {
                description:'separator no readme',
                separators:{
                  componentPropsSeparator:'P'
                },
                expectedReadme:'P'
              },
              {
                readme:'readme',
                description:'no separator',
                expectedReadme:'readme'
              },
              {
                description:'no separator, no readme',
                expectedReadme:undefined
              }
              
            ]

            
            tests.forEach(test => {
              it(test.description, async () => {
                const assetFolderProvider = new AssetFolderProvider(null as any,null as any, null as any, null as any, null as any);
                const componentComponentInfo :ComponentComponentInfo = {
                  readme:test.readme,
                  codeDetails:undefined as any,
                  Component:undefined as any
                }
                assetFolderProvider['getComponentComponentInfo'] = ()=>Promise.resolve(componentComponentInfo);
                
                assetFolderProvider['getPropsCodeDetails'] = () => Promise.resolve(undefined as any);
                const result = await assetFolderProvider['generateComponentInfosForAllProps'](
                  {
                    props:[]
                  },null as any,'','',false,test.separators);
                expect(result[0].readme).toBe(test.expectedReadme);
              })
            })
          })
          
        })
        describe('props can have PropsSeparator or ComponentPropsSeparator or ComponentSeparator', ()=> {
          type PropsReadme<T> = [T,T];
          interface SeparatedPropsTest{
            description:string,
            separators?:ComponentInfoSeparators,
            readmes:PropsReadme<string|undefined>,
            expectedReadmes:PropsReadme<string>,
            isFirst:boolean
          }
          const tests:SeparatedPropsTest[] = [
            {
              description:'has props separator regardless of isFirst for all',
              isFirst:true,
              readmes:['readme1','readme2'],
              separators:{
                propSeparator:'p'
              },
              expectedReadmes:['preadme1','preadme2']
            },
            {
              description:'preference propsSeparator',
              isFirst:false,
              readmes:['readme1','readme2'],
              separators:{
                propSeparator:'p',
                componentPropsSeparator:'cp',
                componentSeparator:'c'
              },
              expectedReadmes:['preadme1','preadme2']
            },
            {
              description:'fallback componentPropsSeparator',
              isFirst:true,
              readmes:['readme1','readme2'],
              separators:{
                componentPropsSeparator:'cp',
                componentSeparator:'c'
              },
              expectedReadmes:['cpreadme1','cpreadme2']
            },
            {
              description:'fallback componentSeparator',
              isFirst:true,
              readmes:['readme1','readme2'],
              separators:{
                componentSeparator:'c'
              },
              expectedReadmes:['creadme1','creadme2']
            },
            {
              description:'separates when no readme',
              isFirst:true,
              readmes:[undefined,undefined],
              separators:{
                componentSeparator:'c'
              },
              expectedReadmes:['c','c']
            }
          ];
          tests.forEach(test => {
            it(test.description, async () => {
              const assetFolderProvider = new AssetFolderProvider(null as any,null as any, null as any, null as any, null as any);
              const componentComponentInfo :ComponentComponentInfo = {
                readme:'',
                codeDetails:undefined as any,
                Component:undefined as any
              }
              assetFolderProvider['getComponentComponentInfo'] = ()=>Promise.resolve(componentComponentInfo);
              
              assetFolderProvider['getPropsCodeDetails'] = () => Promise.resolve({language:'',code:['','']} as PropsCodeDetails);
              assetFolderProvider['getPropsAndOptions'] = ()=>({props:{},propsOptions:{}})
              assetFolderProvider['getPropsReadme'] = jest.fn().mockResolvedValueOnce(test.readmes[0]).mockResolvedValueOnce(test.readmes[1]);
              const result = await assetFolderProvider['generateComponentInfosForAllProps'](
                {
                  props:[{},{}]
                },{},'','',false,test.separators);
              expect(result.length).toBe(3)
              expect(result[1].readme).toBe(test.expectedReadmes[0]);
              expect(result[2].readme).toBe(test.expectedReadmes[1]);
            })
          })
        })
        
      })
      describe('has props', () => {
        it('should call generateComponentInfosForAllProps when component options has props with length > 0', async () => {
          const componentOptions:ComponentOptions = {
            props:[{}]
          }
          const assetFolderProvider = new AssetFolderProvider({

          } as any,
          null as any,
          {
            getOptions(){
              return Promise.resolve(componentOptions)
            }
          } as any, 
          null as any, 
          null as any);

          const mockComponentInfos = [{mock:'componentInfo'}];
          const generateComponentInfosForAllProps = jest.fn().mockResolvedValue(mockComponentInfos)
          assetFolderProvider['generateComponentInfosForAllProps'] = generateComponentInfosForAllProps

          const mergedOptions = {merged:'option'} as any;
          assetFolderProvider['getMergedOptions'] = () => mergedOptions;

          const componentInfosForFolder = await assetFolderProvider['getComponentInfosForFolder']('path','name',{pass:'through'} as any,{componentSeparator:'X'});
          expect(componentInfosForFolder).toBe(mockComponentInfos);
          expect(generateComponentInfosForAllProps).toHaveBeenCalledWith(componentOptions,mergedOptions,'path','name',{pass:'through'},{componentSeparator:'X'});
        })
        describe('generateComponentInfosForAllProps', () => {
          beforeEach(()=>{
            jest.clearAllMocks();
          })
          const componentAssetFolder='path';
          const componentAssetFolderName = 'name';

          const mockComponentComponentInfo:ComponentComponentInfo = {
            readme:'Component readme',
            codeDetails:{
              code:'Component code',
              language:'Component language'
            },
            Component:function(){} as any
          };
          const getComponentComponentInfo = jest.fn().mockResolvedValue(mockComponentComponentInfo);
          
          const propsCodeDetails:PropsCodeDetails = {
            code:['props 1 code','props 2 code'],
            language:'javascript'
          }
          let getPropsCodeDetails:jest.Mock 

          
          let propsAndOptionsFirst:ReturnType<AssetFolderProvider['getPropsAndOptions']> = {
            props:{prop1:1},
            propsOptions:{
              screenshotOptions:{
                css:'From props options',
              },
              altText:'props 1 alt text'
            }
          };
          let propsAndOptionsSecond:ReturnType<AssetFolderProvider['getPropsAndOptions']> = {
            props:{prop1:2},
            propsOptions:{
              altText:'props 2 alt text'
            }
          };
          let getPropsAndOptions:jest.Mock
          
          const propsReadmeFirst = 'props 1 readme';
          const propsReadmeSecond = 'props 2 readme';
          let getPropsReadme:jest.Mock
          function generateComponentInfosForAllPropsTest(componentOptions:ComponentOptionsWithProps,mergedOptions:ComponentOptionsCommon){
            getPropsAndOptions = jest.fn().mockReturnValueOnce(propsAndOptionsFirst).mockReturnValueOnce(propsAndOptionsSecond);
            getPropsCodeDetails = jest.fn().mockResolvedValue(propsCodeDetails);
            getPropsReadme = jest.fn().mockResolvedValueOnce(propsReadmeFirst).mockResolvedValueOnce(propsReadmeSecond);
            const assetFolderProvider = new AssetFolderProvider(null as any,null as any, null as any, null as any, null as any);
            assetFolderProvider['getComponentComponentInfo'] = getComponentComponentInfo;
            assetFolderProvider['getPropsAndOptions'] = getPropsAndOptions;
            assetFolderProvider['getPropsCodeDetails'] = getPropsCodeDetails;
            assetFolderProvider['getPropsReadme'] = getPropsReadme;
            return assetFolderProvider['generateComponentInfosForAllProps'](componentOptions
            ,mergedOptions,componentAssetFolder,componentAssetFolderName,true,undefined)
          }
          
          it('should have ComponentInfo for component with readme and codeDetails only', async () => {
            const componentOptions = {props:[]}
            const mergedOptions = {some:'merged option'};
            const result = await generateComponentInfosForAllPropsTest(componentOptions as any,mergedOptions as any);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual<ComponentInfo>({name:'',readme:mockComponentComponentInfo.readme,codeDetails:mockComponentComponentInfo.codeDetails});
            expect(getComponentComponentInfo).toHaveBeenCalledWith(componentOptions,mergedOptions,'path');
          })
          
          describe('ComponentInfo for each props entry', () => {
            it('should get props and options, props for the screenshot', async () => {
              const componentOptions:ComponentOptionsWithProps = {
                props:[{prop1:1},{prop1:2}]
              }
              const result = await generateComponentInfosForAllPropsTest(componentOptions,{});
              expect(result.length).toBe(3);
              expect(result[1].componentScreenshot!.props).toBe(propsAndOptionsFirst.props);
              expect(result[2].componentScreenshot!.props).toBe(propsAndOptionsSecond.props);
              expect(getPropsAndOptions).toHaveBeenNthCalledWith(1,componentOptions.props[0]);
              expect(getPropsAndOptions).toHaveBeenNthCalledWith(2,componentOptions.props[1]);
            })
            describe('getPropsAndOptions', () => {
              interface PropsAndOptionsTest{
                description:string
                propsOrPropsWithOptions:PropsOrPropsWithOptions,
                expected:PropsAndOptions
              }
              const props:Props = {prop1:1};
              const propsOptions:PropsOptions = {readme:'props readme'};
              const tests:PropsAndOptionsTest[] = [
                {
                  description:'props and options',
                  propsOrPropsWithOptions:[props,propsOptions],
                  expected:{
                    props,
                    propsOptions
                  }
                },
                {
                  description:'just props',
                  propsOrPropsWithOptions:props,
                  expected:{
                    props,
                    propsOptions:{}
                  }
                }
              ]
              tests.forEach(test => {
                it(test.description, () => {
                  const assetFolderProvider = new AssetFolderProvider(null as any,null as any, null as any, null as any, null as any);
                  expect(assetFolderProvider['getPropsAndOptions'](test.propsOrPropsWithOptions)).toEqual(test.expected);
                })
              })
            })
            it('should get code details for the ComponentInfo', async() => {
              const componentOptions:ComponentOptionsWithProps = {
                props:[{prop1:1},{prop1:2}]
              }
              const mergedOptions = {merged:'option'} as any;
              const result = await generateComponentInfosForAllPropsTest(componentOptions,mergedOptions);
              expect(result[1].codeDetails).toEqual<CodeDetails>({code:propsCodeDetails.code[0],language:propsCodeDetails.language});
              expect(result[2].codeDetails).toEqual<CodeDetails>({code:propsCodeDetails.code[1],language:propsCodeDetails.language});
              expect(getPropsCodeDetails).toHaveBeenCalledWith(mergedOptions,'path');
            })
            describe('getPropsCodeDetails', () => {
              it('should be undefined if mergedOptions.propsCodeInReadme is None',async () => {
                const assetFolderProvider = new AssetFolderProvider(null as any,null as any, null as any, null as any, null as any);
                const result = await assetFolderProvider['getPropsCodeDetails']({propsCodeInReadme:'None'},'');
                expect(result).toBeUndefined();
              })
              const propsCodeInReadmeTests:Array<CodeInReadme|undefined> = ['Js',undefined];
              propsCodeInReadmeTests.forEach(propsCodeInReadme => {
                it('should get props code from the componentFolderOptionsProvider if mergedOptions.propsCodeInReadme is not None', async () => {
                  const propsCode = {code:'props code',language:'language'};
                  const getPropsCode = jest.fn().mockResolvedValue(propsCode);
                  const assetFolderProvider = new AssetFolderProvider(null as any,null as any, {
                    getPropsCode
                  } as any, null as any, null as any);
                  const componentAssetFolder = 'path';
                  const result = await assetFolderProvider['getPropsCodeDetails']({propsCodeInReadme},componentAssetFolder);
                  expect(result).toBe(propsCode);
                  expect(getPropsCode).toHaveBeenCalledWith(componentAssetFolder,propsCodeInReadme==='Js');
                })
              })
              
              it('should throw error if cannot find the props code', () => {
                const assetFolderProvider = new AssetFolderProvider(null as any,null as any, {
                  getPropsCode(){
                    return undefined;
                  }
                } as any, null as any, null as any);
                
                return expect(()=>assetFolderProvider['getPropsCodeDetails']({},componentAssetFolder)).rejects.toThrowError('Unable to parse props for readme code');
              })
            })

            it('should get the read me and for the ComponentInfo', async () => {
              const componentOptions:ComponentOptionsWithProps = {
                props:[{prop1:1},{prop1:2}]
              }
              const result = await generateComponentInfosForAllPropsTest(componentOptions,{});
              
              expect(result[1].readme).toBe(propsReadmeFirst);
              expect(result[2].readme).toBe(propsReadmeSecond);

              expect(getPropsReadme).toHaveBeenNthCalledWith(1,propsAndOptionsFirst.propsOptions,'path');
              expect(getPropsReadme).toHaveBeenNthCalledWith(2,propsAndOptionsSecond.propsOptions,'path');
            })
            describe('getPropsReadme', () => {
              it('should come from the options.readme if present', async () => {
                const assetFolderProvider = new AssetFolderProvider(null as any,null as any, null as any, null as any, null as any);
                const propsReadme = await assetFolderProvider['getPropsReadme']({readme:'props readme'},'');
                expect(propsReadme).toBe('props readme');
              })
              it('should be read from options.readmeFileName if present', async () => {
                const assetFolderProvider = new AssetFolderProvider(null as any,null as any, null as any, null as any, null as any);
                const readReadMe = jest.fn().mockResolvedValue('props readme from file');
                assetFolderProvider['readReadMe']=readReadMe;
                const propsReadme = await assetFolderProvider['getPropsReadme']({readmeFileName:'props.readme'},'path');
                expect(propsReadme).toBe('props readme from file');
                expect(readReadMe).toHaveBeenCalledWith('path','props.readme',true);
              })
              describe('readComponentReadMe', () => {
                const componentAssetFolder = 'components/component1';
                const readReadme = 'a readme';
                let pathExists:jest.Mock;
                let readFileString:jest.Mock;
                function readComponentReadmeTest(exists:boolean,readmeName:string|undefined,throwIfDoesNotExist:boolean){
                  pathExists = jest.fn().mockReturnValue(exists);
                  readFileString = jest.fn().mockReturnValue(readReadme);
                  const assetFolderProvider = new AssetFolderProvider({
                    path:{
                      join(...paths:string[]){
                        return paths.join('/');
                      },
                      exists:pathExists

                    },
                    fs:{
                      readFileString
                    }
                  } as any,null as any, null as any, null as any, null as any);

                  return assetFolderProvider['readReadMe'](componentAssetFolder,readmeName,throwIfDoesNotExist);
                }
                it('should check exists in componentAssetFolder', async () => {
                  await readComponentReadmeTest(false,'areadme.md',false);
                  expect(pathExists).toHaveBeenCalledWith(`${componentAssetFolder}/areadme.md`);
                })
                it('should default file name to README.md', async () => {
                  await readComponentReadmeTest(false,undefined,false);
                  expect(pathExists).toHaveBeenCalledWith(`${componentAssetFolder}/README.md`);
                })
                describe('does not exist in the component asset folder', () => {
                  
                  it('should throw if throwIfDoesNotExist', () => {
                    return expect(()=>readComponentReadmeTest(false,undefined,true)).rejects.toThrowError(`Unable to find README.md in ${componentAssetFolder}`);
                  })
                  it('should return undefined if not throwIfDoesNotExist', async () => {
                    expect(await readComponentReadmeTest(false,undefined,false)).toBeUndefined();
                  })
                })
                it('should return the read file if does exist', async () => {
                  expect(await readComponentReadmeTest(true,undefined,false)).toBe(readReadme);
                  expect(readFileString).toHaveBeenCalledWith(`${componentAssetFolder}/README.md`);
                })
              })
            })
            describe('screenshot options', () => {
              it('should have the Component for the screenshot', async () => {
                const componentOptions:ComponentOptionsWithProps = {
                  props:[{prop1:1},{prop1:2}]
                }
                const result = await generateComponentInfosForAllPropsTest(componentOptions,{});
                expect(result[1].componentScreenshot!.Component).toBe(mockComponentComponentInfo.Component);
                expect(result[2].componentScreenshot!.Component).toBe(mockComponentComponentInfo.Component);
              })
              
              it('should have remaining screenshot options from propsOptions', async () => {
                const componentOptions:ComponentOptionsWithProps = {
                  props:[{prop1:1},{prop1:2}]
                }
                const result = await generateComponentInfosForAllPropsTest(componentOptions,{});
                expect(result[1].componentScreenshot!.css).toBe('From props options')
              })
              it('should fallback to merged options for remaining screenshot options', async () => {
                const componentOptions:ComponentOptionsWithProps = {
                  props:[{prop1:1},{prop1:2}]
                }
                const result = await generateComponentInfosForAllPropsTest(componentOptions,{screenshotOptions:{css:'From merged options'}});
                expect(result[2].componentScreenshot!.css).toBe('From merged options')
              })

            })
            it('should have name from component folder name - props - and index', async () => {
              const componentOptions:ComponentOptionsWithProps = {
                props:[{prop1:1},{prop1:2}]
              }
              const result = await generateComponentInfosForAllPropsTest(componentOptions,{});
              
              expect(result[1].name).toBe(`${componentAssetFolderName}-props-0`);
              expect(result[2].name).toBe(`${componentAssetFolderName}-props-1`);

              expect(getPropsReadme).toHaveBeenNthCalledWith(1,propsAndOptionsFirst.propsOptions,'path');
              expect(getPropsReadme).toHaveBeenNthCalledWith(2,propsAndOptionsSecond.propsOptions,'path');
            })
            it('should have alt text from props options', async () => {
              const componentOptions:ComponentOptionsWithProps = {
                props:[{prop1:1},{prop1:2}]
              }
              const result = await generateComponentInfosForAllPropsTest(componentOptions,{});
              
              expect(result[1].altText).toBe('props 1 alt text');
              expect(result[2].altText).toBe('props 2 alt text');
            })
          })

        })
        
      })
      describe('does not have props -  [ComponentInfo]', () => {
        describe('component readme', () => {
          it('should have read component readme from component folder in props',async () => {
            const readReadMe = jest.fn().mockResolvedValue('some readme');
            
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
            
            assetFolderProvider['getMergedOptions']=()=>({});
            assetFolderProvider.readReadMe = readReadMe;
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
            assetFolderProvider['getComponentByPath'] = () => null as any;

            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,undefined);
            
            expect(readReadMe).toHaveBeenCalledWith(componentAssetFolderPath);
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
              const componentReadme = await assetFolderProvider.readReadMe('readme-assets/components/Component');
              expect(componentReadme).toEqual('some read me');
              [exists, readFileString].forEach(mock => {
                expect(mock).toHaveBeenCalledWith('readme-assets/components/Component/README.md');
              })
            })
            it('should return undefined if README.md does not exist',async () => {
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
                const componentReadme = await assetFolderProvider.readReadMe('readme-assets/components/Component');
                expect(componentReadme).toBeUndefined();
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
            
            const mergedOptions = {
              screenshotOptions:{
                type:'jpeg'
              },
            }
            assetFolderProvider['getMergedOptions']=()=>mergedOptions as any;
            assetFolderProvider.readReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);

            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,undefined);
            
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
            
            const mergedOptions = {
              screenshotOptions:{
                type:'jpeg'
              },
            }
            assetFolderProvider['getMergedOptions']=()=>mergedOptions as any;
            assetFolderProvider.readReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);

            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,undefined);
            
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
              
              const mergedOptions = {
                screenshotOptions:{
                  type:'jpeg'
                },
              }
              assetFolderProvider['getMergedOptions']=()=>mergedOptions as any;
              assetFolderProvider.readReadMe = () => Promise.resolve({} as any);
              assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
              const componentByPath = ()=>({}) as any;
              assetFolderProvider.getComponentByPath = () => componentByPath;
  
              const componentAssetFolderPath = 'readme-assets/components/Component';
              const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,undefined);
              
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

            const assetFolderProvider = new AssetFolderProvider({
              path:{
                join(...paths:string[]){return paths.join('/')}
              }
            } as any, {} as any,{
              getOptions:()=>Promise.resolve({})
            } as any,noopSorter,{} as any);
            const mergedOptions = {
              codeReplacer:()=>{},
              codeInReadme:'Js'
            }
            assetFolderProvider['getMergedOptions']=()=>mergedOptions as any;
            assetFolderProvider.readReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentCode=getComponentCode;
            assetFolderProvider.getComponentByPath = () => null as any;
            const componentAssetFolderPath = 'readme-assets/components/Component';
            const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,undefined);
            
            expect(componentInfos[0].codeDetails).toEqual(componentCode);
          })
          describe('getting the component code', () => {
            it('should be determined by the merged options', async () => {
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider(
                {
                  path:{
                    join(...parts:string[]){
                      return parts.join('/');
                    }
                  }
                } as any,
                null as any,
                {
                  getOptions(){
                    return Promise.resolve({})
                  }
                } as any,
                noopSorter,
                {} as any);
              
              assetFolderProvider['readReadMe'] = () => Promise.resolve('')
              assetFolderProvider['getComponentByPath'] = () => Promise.resolve({}) as any;

              const getComponentCode = jest.fn().mockResolvedValue({});
              assetFolderProvider['getComponentCode'] = getComponentCode;


              const mergedOptions:ComponentOptionsCommon = {
                codeReplacer:(code:string) => code,
                codeInReadme:'MockOption' as any
              }
              assetFolderProvider['getMergedOptions'] = () => (mergedOptions);

              await assetFolderProvider['getComponentInfosForFolder']('','',true,undefined);
              expect(getComponentCode).toHaveBeenCalledWith(expect.anything(),mergedOptions.codeInReadme, mergedOptions.codeReplacer)
            })
            it('should return empty if mergedOptions.codeInReadme is None', async () => {
              const assetFolderProvider:AssetFolderProvider = new AssetFolderProvider(null as any,null as any,{} as any,noopSorter,{} as any);
              const componentCode = await assetFolderProvider.getComponentCode(null as any, 'None',null as any);
              expect(componentCode).toEqual({code:'',language:''})
            })
            describe('it should call the code provider if mergedOptions.codeInReadme is not None', () => {
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

                  assetFolderProvider['getMergedOptions']=()=>({});
                  assetFolderProvider['getAbsolutePathToJs'] = () => '';
                  assetFolderProvider['readComponentCode'] = readComponentCode;
                  assetFolderProvider['readReadMe'] = () => Promise.resolve('');
                  assetFolderProvider['getComponentByPath'] = () => ({} as any)
                  
                  await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,undefined);
                  
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
        describe('merging options from provider with global options', () => {
          interface MergeOptionsTest{
            description:string,
            componentOptions:ComponentOptions,
            globalOptions:ComponentOptionsCommon,
            expectedMergedOptions:ComponentOptionsCommon
          }
          const tests:MergeOptionsTest[] = [
            {
              description:'should have global options not in component options',
              globalOptions:{
                codeInReadme:'None'
              },
              componentOptions:{},
              expectedMergedOptions:{
                codeInReadme:'None'
              }
            },
            {
              description:'should override gloabl options withcomponent options',
              globalOptions:{
                codeInReadme:'None'
              },
              componentOptions:{
                codeInReadme:'Js'
              },
              expectedMergedOptions:{
                codeInReadme:'Js'
              }
            }
          ]
          tests.forEach(test => {
            it(test.description, async () => {
              const optionsProvider:IComponentFolderOptionsProvider = {
                getOptions(){
                  return Promise.resolve(test.componentOptions)
                },
                getComponentCode:()=>Promise.resolve(null as any)
              } as any;
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
              assetFolderProvider['readReadMe']=()=>Promise.resolve('');
              assetFolderProvider['getComponentCode'] = ()=>Promise.resolve('') as any;
              assetFolderProvider['getComponentByPath'] =()=> ({} as any)
    
    
              const spiedGetMergedOptions = jest.spyOn<any,any>(assetFolderProvider,'getMergedOptions');
             
              await assetFolderProvider.getComponentInfos('',test.globalOptions,undefined);
              const mergedOptions = spiedGetMergedOptions.mock.results[0].value;
              expect(mergedOptions).toEqual(test.expectedMergedOptions);
            })
          });
          
        })
        describe('alt text', () => {
          interface AltTextTest{
            description:string,
            globalOptions?:GlobalComponentOptions,
            componentOptions?:ComponentOptions,
            expectedAltText:string
          }
          const tests:AltTextTest[] = [
            {
              description:'should come from component options if present',
              componentOptions:{
                altText:'from component options'
              },
              globalOptions:{
                altTextFromFolderName:true
              },
              expectedAltText:'from component options'
            },
            {
              description:'should come from folder name if set on global options and no component options',
              globalOptions:{
                altTextFromFolderName:true
              },
              expectedAltText:'Component'
            }
          ];
          tests.forEach(test => {
            
            it(test.description, async () => {
            
              const assetFolderProvider = new AssetFolderProvider(
                {
                  path:{
                    join(...paths:string[]){return paths.join('/')}
                  }
                } as any,
                {} as any,
                {
                  getOptions:()=>Promise.resolve(test.componentOptions)
                } as any,
                noopSorter,
                {} as any
              );
              
              assetFolderProvider['getMergedOptions']=()=>({});
              assetFolderProvider.readReadMe = () => Promise.resolve('');
              assetFolderProvider.getComponentCode=()=>Promise.resolve({} as any);
              assetFolderProvider['getComponentByPath'] = () => null as any;
              if(test.globalOptions){
                assetFolderProvider['globalOptions'] = test.globalOptions
              }

              const componentAssetFolderPath = 'readme-assets/components/Component';
              const componentInfos = await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,undefined);
              
              
              expect(componentInfos.length).toBe(1);
              expect(componentInfos[0].altText).toBe(test.expectedAltText);
            })
          
          })
        });
        
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

            
            assetFolderProvider['getMergedOptions']=()=>({});

            assetFolderProvider.readReadMe = () => Promise.resolve({} as any);
            assetFolderProvider.getComponentByPath = getComponentByPath;
            assetFolderProvider['readComponentCode'] = readComponentCode;

            await assetFolderProvider['getComponentInfosForFolder'](componentAssetFolderPath,'Component',true,undefined);
            
            expect(readComponentCode.mock.calls[0][0]).toBe(test.expectedComponentPath);
            expect(getComponentByPath.mock.calls[0][0]).toBe(test.expectedComponentPath);
          })
        })
      })
    })
  })
})
  