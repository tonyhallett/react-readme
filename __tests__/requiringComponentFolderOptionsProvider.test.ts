import { RequiringComponentFolderOptionsProvider } from '../src/asset-management/RequiringComponentFolderOptionsProvider'
import { LanguageReaderResult } from '../src/asset-management/LanguageReader';
describe('RequiringComponentFolderOptionsProvider', () => {
  describe('getOptions', () => {
    it('should use the readmeRequirer', async () => {
      const exists = jest.fn().mockResolvedValue(true);
      const reactReadmeRequiredOptions = {};
      const read = jest.fn().mockReturnValue(reactReadmeRequiredOptions);
      const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
        exists,
        read
      } as any, null as any, null as any, null as any);
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
      } as any, null as any, null as any, null as any);
      const folderPath = 'some component folder path';
      const options = await requiringComponentFolderOptionsProvider.getOptions(folderPath);
      expect(options).toBeUndefined();
    })
  
    describe('component defined and componentPath undefined',  () => {
      it('should get the path and key with the IResolvedObjectPathFinder excluding the component folder and set on options', async () => {
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
        }, null as any, null as any);
        const options = await requiringComponentFolderOptionsProvider.getOptions('');
        expect(resolve).toHaveBeenCalledWith(reactReadmeRequiredOptions.component,exclude);
        expect(options!.componentPath).toBe('resolved object module path');
        expect(options!.componentKey).toBe('exports key');
      })
    })
  })
  
  describe('getComponentCode', () => {
    it('should return the language found by the language reader for the react-readme', async () => {
      const reactReadmepath='react-readme.js';
      const getReactReadmeInFolder = jest.fn().mockReturnValue(reactReadmepath);

      const languageReaderResult:LanguageReaderResult = {
        code:'code',
        language:'javascript',
        readPath:'readpath'
      }
      const languageReaderRead = jest.fn().mockResolvedValue(languageReaderResult);
      const getComponentCode = jest.fn().mockReturnValue('parsed code');

      const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
        getReactReadmeInFolder
      } as any, 
      null as any, 
      {read:languageReaderRead} as any, 
      {getComponentCode}
      );
      const componentAssetFolderPath = 'component1';
      const mockIsJs = {pass:'through'} as any;
      const componentCode = await requiringComponentFolderOptionsProvider.getComponentCode(componentAssetFolderPath,mockIsJs);

      expect(componentCode.language).toBe(languageReaderResult.language);
      expect(getReactReadmeInFolder).toHaveBeenCalledWith(componentAssetFolderPath);
      expect(languageReaderRead).toHaveBeenCalledWith(reactReadmepath,mockIsJs);
      
    })
    it('should return parsed code of the react-readme found by the language reader', async () => {
      const getReactReadmeInFolder = jest.fn();

      const languageReaderResult:LanguageReaderResult = {
        code:'code',
        language:'javascript',
        readPath:'readpath'
      }
      const languageReaderRead = jest.fn().mockResolvedValue(languageReaderResult);
      const parsedCode = 'parsed code';
      const getComponentCode = jest.fn().mockReturnValue(parsedCode);

      const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
        getReactReadmeInFolder
      } as any, 
      null as any, 
      {read:languageReaderRead} as any, 
      {getComponentCode}
      );

      const componentAssetFolderPath = 'component1';
      const mockIsJs = {pass:'through'} as any;
      const componentCode = await requiringComponentFolderOptionsProvider.getComponentCode(componentAssetFolderPath,mockIsJs);

      expect(getComponentCode).toHaveBeenCalledWith(languageReaderResult.readPath,languageReaderResult.code);
      expect(componentCode.code).toBe(parsedCode);
    })

    describe('errors', () => {
      describe('it should throw error if the language reader cannot find the file to parse', () => {
        const mockSearchPathsTests = [['react-readme.js'],['react-readme.ts','react-readme.tsx','react-readme.js']];
        mockSearchPathsTests.forEach(mockSearchPaths => {
          const description = mockSearchPaths.length===1?'Cannot find ':'Cannot find one of ';
          it(description, () => {
            const getReactReadmeInFolder = jest.fn().mockReturnValue('react-readme.js');
      
            const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider(
              {
                getReactReadmeInFolder
              } as any, 
              null as any, 
              {
                read:()=>Promise.resolve(undefined) as any, 
                searchPaths:()=>mockSearchPaths
              } as any,
              null as any
            );
            let expectedErrorMessage = description
            if(mockSearchPaths.length===1){
              expectedErrorMessage += mockSearchPaths[0];
            }else{
              expectedErrorMessage+= mockSearchPaths.join();
            }
            return expect(requiringComponentFolderOptionsProvider.getComponentCode('',true)).rejects.toThrow(expectedErrorMessage)
          })
        })
      })
      it('should throw wrapped error with the path of file being parsed if the options parser throws', () => {
        const getReactReadmeInFolder = jest.fn();
  
        const languageReaderResult:LanguageReaderResult = {
          code:'code',
          language:'javascript',
          readPath:'react-readme.someExtension'
        }
        const languageReaderRead = jest.fn().mockResolvedValue(languageReaderResult);
        
        const optionsParseError = new Error('Parse error');
  
        const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
          getReactReadmeInFolder
        } as any, 
        null as any, 
        {read:languageReaderRead} as any, 
        {getComponentCode(){
          throw optionsParseError
        }}
        );
        
        return expect(requiringComponentFolderOptionsProvider.getComponentCode('',false)).rejects.toThrow('error parsing component in react-readme.someExtension\nParse error')
      });

      [undefined,''].forEach(parsedCode => {
        const suffix = parsedCode === undefined?'undefined':'empty string'
        it(`should throw error with the path of file being parsed if the options parser return ${suffix}`, () => {
          const getReactReadmeInFolder = jest.fn();

          const languageReaderResult:LanguageReaderResult = {
            code:'code',
            language:'javascript',
            readPath:'react-readme.someExtension'
          }
          const languageReaderRead = jest.fn().mockResolvedValue(languageReaderResult);
          
    
          const requiringComponentFolderOptionsProvider = new RequiringComponentFolderOptionsProvider({
            getReactReadmeInFolder
          } as any, 
          null as any, 
          {read:languageReaderRead} as any, 
          {getComponentCode(){
            return parsedCode
          }}
          );

          return expect(requiringComponentFolderOptionsProvider.getComponentCode('',false)).rejects.toThrow('could not parse component in react-readme.someExtension')
        
        })
      })

      
    })

    
  })
})