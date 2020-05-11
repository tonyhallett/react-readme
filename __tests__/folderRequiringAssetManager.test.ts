import {createFolderRequiringAssetManager} from '../src/asset-management/FolderRequiringAssetManager';
import { RequiringOptionsProvider } from '../src/asset-management/RequiringOptionsProvider';
import { ResolvedObjectPathFinder } from '../src/asset-management/ResolvedObjectPathFinder';
import { AssetManagerOptions } from '../src/asset-management/AssetManagerOptions';
import { AssetManager } from '../src/asset-management/AssetManager';
import { AssetFolderProvider } from '../src/asset-management/AssetFolderProvider';
import { SuffixComponentSorter } from '../src/SuffixComponentSorter';
import { IAssetManager } from '../src/interfaces';

jest.mock('../src/asset-management/ResolvedObjectPathFinder');
jest.mock('../src/asset-management/AssetManagerOptions');
jest.mock('../src/asset-management/AssetManager');
jest.mock('../src/asset-management/AssetFolderProvider');
jest.mock('../src/SuffixComponentSorter');
jest.mock('../src/asset-management/RequiringOptionsProvider')

const mockAssetManagerOptions = AssetManagerOptions as jest.MockedClass<typeof AssetManagerOptions>;

const mockRequiringOptionsProvider = RequiringOptionsProvider as jest.MockedClass<typeof RequiringOptionsProvider>;
const requiringComponentFolderOptionsProvider = {} as any;
const requiringGlobalOptionsProvider = {} as any
mockRequiringOptionsProvider.prototype.componentFolderOptionsProvider = requiringComponentFolderOptionsProvider;
mockRequiringOptionsProvider.prototype.globalOptionsProvider = requiringGlobalOptionsProvider;

const mockResolvedObjectPathFinder = ResolvedObjectPathFinder as jest.Mock;
const mockAssetManager = AssetManager as jest.MockedClass<typeof AssetManager>;
const mockAssetFolderProvider = AssetFolderProvider as jest.MockedClass<typeof AssetFolderProvider>

function getAssetManagerArg(index:number){
  return mockAssetManager.mock.calls[0][index];
}
describe('createFolderRequiringAssetManager', () => {
  beforeEach(async ()=>{
    jest.clearAllMocks();
    await create();
  })
  const system = {} as any;
  const requirer = {} as any;
  const componentSorter = {} as any;
  let assetManager:IAssetManager
  async function create(){
    mockAssetManagerOptions.prototype.init.mockResolvedValue();
    assetManager = await createFolderRequiringAssetManager(system, requirer, componentSorter);
  }
  it('should return an AssetManager', () => {
    expect(assetManager).toBeInstanceOf(AssetManager);
  })
  it('should construct as single asset manager', () => {
    expect(mockAssetManager.mock.instances.length).toBe(1);
  })
  it('should be passed System', () => {
    expect(getAssetManagerArg(2)).toBe(system);
  })
  describe('RequiringOptionsProvider', () => {
    it('should be passed System', () => {
      expect(mockRequiringOptionsProvider.mock.calls[0][0]).toBe(system);
    })
    it('should be passed requirer', () => {
      expect(mockRequiringOptionsProvider.mock.calls[0][1]).toBe(requirer);
    })
    it('should use ResolvedObjectPathFinder', () => {
      expect(mockRequiringOptionsProvider.mock.calls[0][2]).toBeInstanceOf(ResolvedObjectPathFinder);
    })
    describe('ResolvedObjectPathFinder', () => {
      it('should be passed requirer', () => {
        expect(mockResolvedObjectPathFinder.mock.calls[0][0]).toBe(requirer);
      })
    })
  })
  describe('AssetManagerOptions', () => {
    function getAssetManagerOptions(){
      return getAssetManagerArg(0);
    }
    function getAssetManagerOptionsCtorArg(index:number){
      return mockAssetManagerOptions.mock.calls[0][index];
    }
    it('should be the AssetManager options', () => {
      expect(mockAssetManagerOptions.mock.instances.length).toBe(1);
      expect(getAssetManagerOptions()).toBeInstanceOf(AssetManagerOptions);
    })
    it('should have been constructed the once', () => {
      expect(mockAssetManagerOptions.mock.instances.length).toBe(1);
    })
    it('should have requiring global options provider', () => {
      expect(getAssetManagerOptionsCtorArg(1)).toBe(requiringGlobalOptionsProvider);
    })
    it('should be passed System', () => {
      expect(getAssetManagerOptionsCtorArg(0)).toBe(system);
    })
    it('should init', () => {
      expect(mockAssetManagerOptions.mock.instances[0].init).toHaveBeenCalled();
    })
    
  })

  describe('AssetFolderProvider', () => {
    function getCtorArg(index:number){
      return mockAssetFolderProvider.mock.calls[0][index];
    }
    it('should be the AssetManager folder provider', () => {
      expect(getAssetManagerArg(1)).toBeInstanceOf(AssetFolderProvider);
    })
    it('should be constructed the once', () => {
      expect(mockAssetFolderProvider.mock.instances.length).toBe(1);
    })
    it('should be passed system', () => {
      expect(getCtorArg(0)).toBe(system);
    })
    it('should be passed the requirer', ()=> {
      expect(getCtorArg(1)).toBe(requirer);
    })
    it('should have requiring options', () => {
      expect(getCtorArg(2)).toBe(requiringComponentFolderOptionsProvider);
    })
    it('should be passed the component sorter', () => {
      expect(getCtorArg(3)).toBe(componentSorter);
    })
  })
})
/*
export async function createFolderRequiringAssetManager(system:ISystem,requirer:IRequirer):Promise<IAssetManager>{
  const optionsProvider:IOptionsProvider = new RequiringOptionsProvider(system, requirer, new ResolvedObjectPathFinder(require));
  const assetManagerOptions = new AssetManagerOptions(system, optionsProvider.globalOptionsProvider);
  await assetManagerOptions.init();
  const assetManager = new AssetManager(
    assetManagerOptions, 
    new AssetFolderProvider(
      system,
      requirer,
      optionsProvider.componentFolderOptionsProvider,
      new SuffixComponentSorter()),
    system)
  return assetManager;
}
*/
