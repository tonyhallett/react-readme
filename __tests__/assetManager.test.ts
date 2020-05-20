import {AssetManager, IAssetFolderProvider, ComponentInfoProvider, IAssetManagerOptions} from '../src/asset-management/AssetManager'
import { IAssetManager } from '../src/interfaces';

describe('AssetManager', () => {
  describe('it should expose imageBeforeCode from options', () => {
    interface ImageBeforeCodeTest{
      description:string
      imageBeforeCode:boolean|undefined,
      expectedImageBeforeCode:boolean
    }
    const tests:Array<ImageBeforeCodeTest> = [
      {
        description:'true',
        expectedImageBeforeCode:true,
        imageBeforeCode:true
      },
      {
        description:'false',
        expectedImageBeforeCode:false,
        imageBeforeCode:false
      },
      {
        description:'undefined defaults to true',
        expectedImageBeforeCode:true,
        imageBeforeCode:undefined
      }
    ];
    tests.forEach(test => {
      it(test.description, () => {
        const assetManager:IAssetManager = new AssetManager({
          imageBeforeCode:test.imageBeforeCode,
          readmeAssetsFolderPath:'readme-assets'
        } as any,null as any,{path:{join:()=>''}} as any);
        
        expect(assetManager.imageBeforeCode).toBe(test.expectedImageBeforeCode);
      })
    })
  })
  
  it('should expose the puppeteer launch options from options', async () => {
    const puppeteerLaunchOptions = {};
    const assetManager:IAssetManager = new AssetManager({
      puppeteerLaunchOptions,
      readmeAssetsFolderPath:'readme-assets'
    } as any,null as any,{path:{join:()=>''}} as any);
    
    expect(assetManager.puppeteerLaunchOptions).toBe(puppeteerLaunchOptions);
  })
  it('should clean component images folder in the read me assets folder', async () => {
    const emptyDir = jest.fn();
    const assetManager:IAssetManager = new AssetManager(
      {
        readmeAssetsFolderPath:'readme-assets-path',
      } as any,
      null as any,
      {
        path:{
          join(...parts:string[]):string{
            return parts.join('/')
          }
        } as any,
        fs:{
          emptyDir
        } as any,
        cwd:''
      }
    );
    await assetManager.cleanComponentImages();
    expect(emptyDir).toHaveBeenCalledWith('readme-assets-path/images');
  })
  it('should get component image path - from images folder in the read me assets folder', () => {
    const assetManager:IAssetManager = new AssetManager(
      {
        readmeAssetsFolderPath:'readme-assets-path',
      } as any,
      null as any,
      {
        path:{
          join(...parts:string[]):string{
            return parts.join('/')
          }
        } as any,
        fs:{
        } as any,
        cwd:''
      }
    );
    const componentImagePath = assetManager.getComponentImagePath('component.png');
    expect(componentImagePath).toBe('readme-assets-path/images/component.png');
  })
  describe('should read surrounding read me', () => {
    let mockReadUntilExists:jest.Mock
    function createAssetManager(readUntilExists:jest.Mock,additionalOptions:Partial<IAssetManagerOptions>={}){
      mockReadUntilExists = readUntilExists;
      const assetManager:IAssetManager = new AssetManager(
        {
          readmeAssetsFolderPath:'readme-assets-path',
          ...additionalOptions
        } as any,
        null as any,
        {
          path:{
            join(...parts:string[]):string{
              return parts.join('/')
            }
          } as any,
          fs:{
            readUntilExists
          } as any,
          cwd:''
        },
      );
      return assetManager;
    }
    
    it('should readUntilExists README.md or READMEPre.md for pre', async () => {
      const assetManager = createAssetManager(jest.fn().mockReturnValue({read:'Some pre markdown'}));
      const pre =  await assetManager.readSurroundingReadme(true);
      expect(pre).toBe('Some pre markdown');
      expect(mockReadUntilExists).toHaveBeenCalledWith('readme-assets-path/README.md','readme-assets-path/READMEPre.md');
    })

    it('should readUntilExists READMEPost.md', async () => {
      const assetManager = createAssetManager(jest.fn().mockReturnValue({read:'Some post markdown'}));
      const pre =  await assetManager.readSurroundingReadme(false);
      expect(pre).toBe('Some post markdown');
      expect(mockReadUntilExists).toHaveBeenCalledWith('readme-assets-path/READMEPost.md');
    })
    it('should append first separator if pre exists', async () => {
      const assetManager = createAssetManager(jest.fn().mockReturnValue({read:'Some pre markdown'}),{
        separators:{
          first:'first'
        }
      });
      const pre =  await assetManager.readSurroundingReadme(true);
      expect(pre).toBe('Some pre markdownfirst');
    })
    it('should prepend last separator if post exists',async () => {
      const assetManager = createAssetManager(jest.fn().mockReturnValue({read:'Some post markdown'}),{
        separators:{
          last:'post'
        }
      });
      const pre =  await assetManager.readSurroundingReadme(false);
      expect(pre).toBe('postSome post markdown');
    })

  });

  describe('getComponentInfos',()=>{
    it('should get from AssetFolderProvider passing componentAssetsFolder and options', async () => {
      const componentInfos = [ {mock:'componentinfo'}, {mock:'componentinfo2'}  ]
      const getComponentInfos = jest.fn().mockResolvedValue(componentInfos);
      const options = {
        readmeAssetsFolderPath:'readme-assets',
        globalComponentOptions:{

        }
      }
      const assetManager = new AssetManager(
        options as any,
        {
          getComponentInfos
        },
        {
          path:{
            join:(...paths:string[])=>paths.join('/')
          }
        } as any
      );
      const infos = await assetManager.getComponentInfos();
      expect(infos).toEqual(componentInfos);
      expect(getComponentInfos).toHaveBeenCalledWith<Parameters<IAssetFolderProvider['getComponentInfos']>>('readme-assets/components',options.globalComponentOptions,undefined);
    });
    it('should get from all registered component info providers and AssetFolderProvider', async () => {
      const componentInfos = [ {mock:'componentinfo'}, {mock:'componentinfo2'}  ]
      const options = {
        readmeAssetsFolderPath:'readme-assets'
      }
      const assetManager = new AssetManager(
        options as any,
        {
          getComponentInfos:jest.fn().mockResolvedValue(componentInfos)
        },
        {
          path:{
            join:(...paths:string[])=>paths.join('/')
          }
        } as any
      );
      const componentInfo1 = {mock:'componentinfoP'};
      const componentInfoProvider1:ComponentInfoProvider<any> = {
        getComponentInfos:jest.fn().mockResolvedValue(componentInfo1)
      }
      const componentInfo2 = {mock:'componentinfoP2'};
      const componentInfoProvider2:ComponentInfoProvider<any> = {
        getComponentInfos:jest.fn().mockResolvedValue(componentInfo2)
      }
      assetManager.registerComponentInfoProviders(componentInfoProvider1,componentInfoProvider2)
      const infos = await assetManager.getComponentInfos();
      expect(infos).toEqual(componentInfos.concat([componentInfo1,componentInfo2]));
    })
    
  })
})

