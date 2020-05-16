import { LanguageReader, LanguageReaderResult } from "../src/asset-management/LanguageReader";

export type PromiseValue<PromiseType, Otherwise = PromiseType> = PromiseType extends Promise<infer Value> ? Value : Otherwise;

describe('LanguageReader', () => {
  describe('read', () => {
    it('should readUntilExists returning undefined if did not read', async () => {
      const languageReader = new LanguageReader(null as any);
      const readUntilExistsResult:PromiseValue<ReturnType<LanguageReader['readUntilExists']>>={
        didRead:false,
        language:undefined,
        read:undefined,
        readPath:undefined
      }
      const readUntilExists = jest.fn().mockResolvedValue(readUntilExistsResult);
      languageReader['readUntilExists'] = readUntilExists;
      const path = 'path.js';
      const mockIsJs  = {is:'js'} as any;


      const result = await languageReader.read(path,mockIsJs);

      expect(result).toBeUndefined();
      expect(readUntilExists).toHaveBeenCalledWith(path,mockIsJs)
    })
    it('should return read, readPath and language if does exist', async () => {
      const languageReader = new LanguageReader(null as any);
      const readUntilExistsResult:PromiseValue<ReturnType<LanguageReader['readUntilExists']>>={
        didRead:true,
        language:'typescript',
        read:'code',
        readPath:'path'
      }
      const readUntilExists = jest.fn().mockResolvedValue(readUntilExistsResult);
      languageReader['readUntilExists'] = readUntilExists;

      const path = 'path.js';
      const mockIsJs  = {is:'js'} as any;

      const result = await languageReader.read(path,mockIsJs);
      
      expect(result).toEqual({code:'code',language:'typescript',readPath:'path'});
    })
  })
  
  describe('readUntilExists', () => {
    it('should only read js if js true and return language javascript if exists', async () => {
      const readUntilExistsResult = {
        didRead:true,
        read:'some js',
        readPath:'readme-assets/components/Component/index.js'
      }
      const readUntilExists = jest.fn().mockResolvedValue(readUntilExistsResult);
      const extname = jest.fn().mockReturnValue('.js')
      const languageReader:LanguageReader = new LanguageReader({
        path:{
          join(...paths:string[]){
            return paths.join('/');
          },
          extname
        },
        fs:{
          readUntilExists
        }
      } as any);
      const result = await languageReader['readUntilExists']('readme-assets/components/Component/index.js', true);
      expect(readUntilExists).toHaveBeenCalledWith('readme-assets/components/Component/index.js');
      expect(result).toEqual({...readUntilExistsResult,language:'javascript'});
      
    })
    it('should return the result with no language if did not read', async () => {
      const readUntilExistsResult = {
        didRead:false,
        read:undefined,
        readPath:undefined
      }
      const readUntilExists = jest.fn().mockResolvedValue(readUntilExistsResult);
      const extname = jest.fn().mockReturnValue('.js')
      const languageReader:LanguageReader = new LanguageReader({
        path:{
          join(...paths:string[]){
            return paths.join('/');
          },
          extname
        },
        fs:{
          readUntilExists
        }
      } as any);
      const result = await languageReader['readUntilExists']('readme-assets/components/Component/index.js', true);
      expect(result).toEqual(readUntilExistsResult);
    })
    it('should readUntilExists with preference order ts, tsx, js if codeInReadMe is not Js', async() => {
      const readUntilExistsResult = {
        didRead:true,
        read:'some ts',
        readPath:'readme-assets/components/Component/component.ts'
      }
      const readUntilExists = jest.fn().mockResolvedValue(readUntilExistsResult);
      const extname = jest.fn().mockReturnValue('.ts')
      const languageReader:LanguageReader = new LanguageReader({
        path:{
          join(...paths:string[]){
            return paths.join('/');
          },
          extname
        },
        fs:{
          readUntilExists
        }
      } as any);
      const result = await languageReader['readUntilExists']('readme-assets/components/Component/component.js', false);
      expect(extname).toHaveBeenCalledWith('readme-assets/components/Component/component.ts');
      expect(readUntilExists).toHaveBeenCalledWith(
        'readme-assets/components/Component/component.ts',
        'readme-assets/components/Component/component.tsx',
        'readme-assets/components/Component/component.js');
      expect(result).toEqual({...readUntilExistsResult,language:'typescript'});
    })
  })

  describe('search paths', () => {
    it('should only return js path if js is true', () => {
      const languageReader:LanguageReader = new LanguageReader(null as any);
      const searchPaths = languageReader.searchPaths('some/path.js',true);
      expect(searchPaths).toEqual(['some/path.js']);
    })
    it('should return ts, tsx, js paths if js is false', () => {
      const languageReader:LanguageReader = new LanguageReader(null as any);
      const searchPaths = languageReader.searchPaths('some/path.js',false);
      expect(searchPaths).toEqual(['some/path.ts','some/path.tsx','some/path.js']);
    })
  })
  
})