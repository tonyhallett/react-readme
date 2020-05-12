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
    it('should get the path and key with the IResolvedObjectPathFinder excluding the componet folder and set on options', async () => {
      const resolve = jest.fn().mockReturnValue({path:'resolved object module path',key:'exports key'});

      const exists = jest.fn().mockResolvedValue(true);
      const exclude = 'component/react-readme.js';
      const getReactReadmeInFolder = jest.fn().mockReturnValue(exclude);
      const reactReadmeRequiredOptions = {
        component:function SomeComponent(){}
      };
      const read = jest.fn().mockReturnValue(reactReadmeRequiredOptions);

      const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
        exists,
        read,
        getReactReadmeInFolder
      } as any, {
        resolve
      });
      const options = await requiringComponentFolderOptionsProvider.getOptions('');
      expect(resolve).toHaveBeenCalledWith(reactReadmeRequiredOptions.component,exclude);
      expect(options!.componentPath).toBe('resolved object module path');
      expect(options!.componentKey).toBe('exports key');
    })
  })
})