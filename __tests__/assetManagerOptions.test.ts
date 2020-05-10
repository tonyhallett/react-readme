import { AssetManagerOptions } from "../src/asset-management/AssetManagerOptions";

describe('AssetManagerOptions', () => {
  describe('readmeAssetsFolderPath', () => {
    it('should be absoluteOrCwdJoin to readmeAssetsFolderPath root option if present', async () => {
      const options = {
        readmeAssetsFolderPath: 'some path'
      }
      const getOptions =jest.fn().mockReturnValue(Promise.resolve(options));
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        getOptions
        
      });
      await assetManagerOptions.init();
      expect(getOptions).toHaveBeenCalledWith('root');
      expect(assetManagerOptions.readmeAssetsFolderPath).toBe('relative/some path');
    });

    it('should be cwd/README-assets if no readmeAssetsFolderPath option on root', async () => {
      const options = {
      }
      const getOptions =jest.fn().mockReturnValue(Promise.resolve(options));
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        getOptions
      });
      await assetManagerOptions.init();
      expect(assetManagerOptions.readmeAssetsFolderPath).toBe('relative/README-assets');
    })

    it('should be cwd/README-assets if no root', async () => {
      
      const getOptions =jest.fn().mockReturnValue(Promise.resolve(undefined));
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        getOptions
      });
      await assetManagerOptions.init();
      expect(assetManagerOptions.readmeAssetsFolderPath).toBe('relative/README-assets');
    })

  })

  describe('options', () => {
    it('should come from root if present', async () => {
      const puppeteerLaunchOptions = {};
      const readOptions = {
        puppeteerLaunchOptions
      }
      const getOptions =jest.fn().mockReturnValue(Promise.resolve(readOptions));
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        getOptions
      });
      await assetManagerOptions.init();
      expect(assetManagerOptions.puppeteerLaunchOptions).toBe(readOptions.puppeteerLaunchOptions);
    })

    it('should come from default assets folder if present', async () => {
      const puppeteerLaunchOptions = {};
      const readOptions = {
        puppeteerLaunchOptions
      }
      const getOptions =jest.fn().mockReturnValueOnce(Promise.resolve(undefined)).mockReturnValueOnce(Promise.resolve(readOptions));
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        getOptions
      });
      await assetManagerOptions.init();
      expect(getOptions).toHaveBeenCalledWith('relative/README-assets')
      expect(assetManagerOptions.puppeteerLaunchOptions).toBe(readOptions.puppeteerLaunchOptions);
    })
  })
  
})