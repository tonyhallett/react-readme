import {RequiringGlobalOptionsProvider} from '../src/asset-management/RequiringGlobalOptionsProvider'
describe('RequiringGlobalOptionsProvider', () => {
  it('should use the ReactReadmeRequirer', async() => {
    const exists = jest.fn().mockResolvedValue(true);
    const reactReadmeRequiredOptions = {};
    const read = jest.fn().mockReturnValue(reactReadmeRequiredOptions);
    const requiringGlobalOptionsProvider = new RequiringGlobalOptionsProvider({
      exists,
      read
    } as any);
    const folderPath = 'some component folder path';
    const options = await requiringGlobalOptionsProvider.getOptions(folderPath);
    [exists,read].forEach(mock =>{
      expect(mock).toHaveBeenCalledWith(folderPath);
    })
    expect(options).toBe(reactReadmeRequiredOptions);
  })

  it('should return undefined if does not exist', async () => {
    const exists = jest.fn().mockResolvedValue(false);
    const requiringGlobalOptionsProvider = new RequiringGlobalOptionsProvider({
      exists,
    } as any);
    const folderPath = 'some component folder path';
    const options = await requiringGlobalOptionsProvider.getOptions(folderPath);
    expect(options).toBeUndefined();
  })
})