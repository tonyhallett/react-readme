import { ISystem } from '../interfaces';
export interface ILanguageReader{
  searchPaths(path: string, isJs: boolean):string[];
  read(path: string, javascript: boolean): Promise<LanguageReaderResult|undefined>
  //find(path: string, javascript: boolean): Promise<FindResult| undefined>
}

type Language = 'javascript'|'typescript'|'tsx';
export interface LanguageReaderResult{
  code:string,
  language:Language,
  readPath:string
}
export class LanguageReader implements ILanguageReader {
  constructor(private readonly system: ISystem) { }
  
  private languageLookup: Array<{
    extension: string;
    language: Language;
  }> = [
      // typescript files first
      {
        language: 'typescript',
        extension: '.ts'
      },
      {
        language: 'tsx',
        extension: '.tsx'
      },
      {
        language: 'javascript',
        extension: '.js'
      },
    ];

  
  private async readUntilExists(path: string, javascript: boolean) {
    const languageLookup = javascript ? [this.languageLookup[2]] : this.languageLookup;
    const prefix = path.substr(0, path.length - 3);
    const result = await this.system.fs.readUntilExists(...languageLookup.map(entry => `${prefix}${entry.extension}`));
    let language:Language|undefined = undefined;
    if(result.didRead){
      language = languageLookup.find(entry => entry.extension === this.system.path.extname(result.readPath!))!.language;
    }
    return {...result, language}
  }
  searchPaths(path: string, javascript: boolean) {
    const languageLookup = javascript ? [this.languageLookup[2]] : this.languageLookup;
    const prefix = path.substr(0, path.length - 3);
    return languageLookup.map(entry => `${prefix}${entry.extension}`);
  }
  /* private async readOrFind<T>(path: string, javascript: boolean,mapper:(language:string,read:string,readPath:string)=>T):Promise<T|undefined> {
    const { didRead, read, readPath, language } = await this.readUntilExists(path, javascript);
    if (!didRead) {
      return undefined;
    }
    return mapper(language!,read!,readPath!);
  } */
  async read(path: string, javascript: boolean): Promise<LanguageReaderResult | undefined> {
    /* return this.readOrFind(path, javascript, (language,read) => ({
      code: read,
      language:language
    })) */
    const { didRead, read, readPath, language } = await this.readUntilExists(path, javascript);
    if (!didRead) {
      return undefined;
    }
    return {code:read!,language:language!,readPath:readPath!};
    //return mapper(language!,read!,readPath!);
  }
  /* async find(path: string, javascript: boolean): Promise<{language:string,readPath:string} | undefined> {
    return this.readOrFind(path, javascript, (language,_,readPath) => ({
      readPath: readPath,
      language:language
    }))
  } */
}
