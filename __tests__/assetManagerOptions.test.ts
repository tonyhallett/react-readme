import { AssetManagerOptions } from "../src/AssetManagerOptions";

describe('AssetManagerOptions', () => {
  describe('readmeAssetsFolderPath', () => {
    it('should be absoluteOrCwdJoin to readmeAssetsFolderPath root option if present', async () => {
      const exists = jest.fn().mockReturnValue(true);
      const options = {
        readmeAssetsFolderPath: 'some path'
      }
      const read =jest.fn().mockReturnValue(options);
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        exists,
        read
      });
      await assetManagerOptions.init();
      expect(read).toHaveBeenCalledWith('root');
      expect(read).toHaveBeenCalledWith('root');
      expect(assetManagerOptions.readmeAssetsFolderPath).toBe('relative/some path');
    });

    it('should be cwd/README-assets if no readmeAssetsFolderPath option on root', async () => {
      const exists = jest.fn().mockReturnValue(true);
      const options = {
      }
      const read =jest.fn().mockReturnValue(options);
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        exists,
        read
      });
      await assetManagerOptions.init();
      expect(assetManagerOptions.readmeAssetsFolderPath).toBe('relative/README-assets');
    })

    it('should be cwd/README-assets if no root', async () => {
      const exists = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
      const options = {
      }
      const read =jest.fn().mockReturnValue(options);
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        exists,
        read
      });
      await assetManagerOptions.init();
      expect(assetManagerOptions.readmeAssetsFolderPath).toBe('relative/README-assets');
    })

  })

  describe('options', () => {
    it('should come from root if present', async () => {
      const puppeteerLaunchOptions = {};
      const exists = jest.fn().mockReturnValue(true);
      const readOptions = {
        puppeteerLaunchOptions
      }
      const read =jest.fn().mockReturnValue(readOptions);
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        exists,
        read
      });
      await assetManagerOptions.init();
      expect(assetManagerOptions.puppeteerLaunchOptions).toBe(readOptions.puppeteerLaunchOptions);
    })

    it('should come from default assets folder if present', async () => {
      const puppeteerLaunchOptions = {};
      const exists = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
      const readOptions = {
        puppeteerLaunchOptions
      }
      const read =jest.fn().mockReturnValue(readOptions);
      const assetManagerOptions = new AssetManagerOptions({
        cwd:'root',
        path:{
          absoluteOrCwdJoin:(path:string) => `relative/${path}`
        }
      } as any,{
        exists,
        read
      });
      await assetManagerOptions.init();
      expect(read).toHaveBeenCalledWith('relative/README-assets')
      expect(assetManagerOptions.puppeteerLaunchOptions).toBe(readOptions.puppeteerLaunchOptions);
    })
  })
  
})