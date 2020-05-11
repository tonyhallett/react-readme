import { RequiringComponentFolderOptionsProvider } from '../src/asset-management/RequiringComponentFolderOptionsProvider'
describe('RequiringComponentFolderOptionsProvider getOptions', () => {
  it('should use the readmeRequirer', async () => {
    const exists = jest.fn().mockResolvedValue(true);
    const reactReadmeRequiredOptions = {};
    const read = jest.fn().mockReturnValue(reactReadmeRequiredOptions);
    const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
      exists,
      read
    } as any, null as any);
    const folderPath = 'some component folder path';
    const options = await requiringComponentFolderOptionsProvider.getOptions(folderPath);
    [exists,read].forEach(mock =>{
      expect(mock).toHaveBeenCalledWith(folderPath);
    })
    expect(options).toBe(reactReadmeRequiredOptions);
  })

  it('should return undefined if does not exist', async () => {
    const exists = jest.fn().mockResolvedValue(false);
    const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
      exists,
    } as any, null as any);
    const folderPath = 'some component folder path';
    const options = await requiringComponentFolderOptionsProvider.getOptions(folderPath);
    expect(options).toBeUndefined();
  })

  describe('component defined and componentPath undefined',  () => {
    it('should get the path with the IResolvedObjectPathFinder', async () => {
      const getResolvedPath = jest.fn().mockReturnValue('resolved object module path');

      const exists = jest.fn().mockResolvedValue(true);
      const reactReadmeRequiredOptions = {
        component:function SomeComponent(){}
      };
      const read = jest.fn().mockReturnValue(reactReadmeRequiredOptions);

      const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
        exists,
        read
      } as any, {
        getResolvedPath
      });
      const options = await requiringComponentFolderOptionsProvider.getOptions('');
      expect(getResolvedPath).toHaveBeenCalledWith(reactReadmeRequiredOptions.component);
      expect(options!.componentPath).toBe('resolved object module path');
    })
  })
})