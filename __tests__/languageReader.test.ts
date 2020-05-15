import { LanguageReader } from "../src/asset-management/LanguageReader";
import { CodeDetails } from "../src/interfaces";


describe('LanguageReader', () => {
  describe('readOrFind', () => {
    it('should readUntilExists and return undefined if did not read', async () => {
      const languageReader = new LanguageReader(null as any);

      const readUntilExists = jest.fn().mockResolvedValue({didRead:false})
      languageReader['readUntilExists'] = readUntilExists;

      const path='some path';
      const isJs = {mock:'isJS'} as any;
      expect(await languageReader['readOrFind'](path,isJs,null as any)).toBeUndefined();

      expect(readUntilExists).toHaveBeenCalledWith(path,isJs);
    })
    it('should call the mapper with read,readPath,language and return the mapped result when reads',async () => {
      const languageReader = new LanguageReader(null as any);
      const readResult= {
        didRead:true,
        read:'read',
        readPath:'readPath',
        language:'language'
      }
      const readUntilExists = jest.fn().mockResolvedValue(readResult)
      languageReader['readUntilExists'] = readUntilExists;
      const path='some path';
      const isJs = {mock:'isJS'} as any;
      const mapper =jest.fn().mockReturnValue('mapped');

      expect(await languageReader['readOrFind'](path,isJs,mapper)).toBe('mapped');
      expect(mapper).toHaveBeenCalledWith('language','read','readPath');
    })
  })
  describe('read', () => {
    it('should return readOrFind, mapping returning language and read as code', async () => {
      const languageReader = new LanguageReader(null as any);
      const mappedResult= {
        code:'read',
        language:'language'
      }
      const readOrFind = jest.fn().mockResolvedValue(mappedResult)
      languageReader['readOrFind'] = readOrFind;

      const path='some path';
      const isJs = {mock:'isJS'} as any;
      
      expect(await languageReader['read'](path,isJs)).toBe(mappedResult);
      expect(readOrFind).toHaveBeenCalledWith(path, isJs,expect.anything());
      expect(readOrFind.mock.calls[0][2]('language','read')).toEqual({code:'read',language:'language'})
    });
  })
  describe('find', () => {
    it('should return readOrFind, mapping returning language and readPath', async () => {
      const languageReader = new LanguageReader(null as any);
      const mappedResult= {
        readPath:'readPath',
        language:'language'
      }
      const readOrFind = jest.fn().mockResolvedValue(mappedResult)
      languageReader['readOrFind'] = readOrFind;

      const path='some path';
      const isJs = {mock:'isJS'} as any;
      
     
      expect(await languageReader['find'](path,isJs)).toBe(mappedResult);
      expect(readOrFind).toHaveBeenCalledWith(path, isJs,expect.anything());
      expect(readOrFind.mock.calls[0][2]('language','_','readPath')).toEqual({readPath:'readPath',language:'language'})
    });
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