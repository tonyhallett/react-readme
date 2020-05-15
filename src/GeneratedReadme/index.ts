import { IGeneratedReadme, CodeDetails, ImageDetails } from "../interfaces";

export type MarkdownCodeCreator = (code:string,language:string)=>string
export type MarkdownImageCreator = (path:string,altText:string)=>string

export type NewlineSpacer = (numberOfNewlines:number,parts:Array<Array<string>>)=>string
export class GeneratedReadme implements IGeneratedReadme {
  private componentsReadmeEntries:Array<Array<string>> = [];
  
  constructor(
    private readonly markdownCodeCreator:MarkdownCodeCreator,
    private readonly markdownImageCreator:MarkdownImageCreator,
    private readonly newlineSpacer:NewlineSpacer
    ){}

  private addEntries(...readmePartCreators:Array<()=>string|undefined>){
    const componentReadmeEntries:string[]=[];
    readmePartCreators.forEach(readmePartCreator => {
      const readmePart = readmePartCreator();
      if(readmePart){
        componentReadmeEntries.push(readmePart);
      }
    })
    this.componentsReadmeEntries.push(componentReadmeEntries);
  }

  private createMarkdownCode(code: string, language: string):string | undefined{
    if(code){
      return this.markdownCodeCreator(code,language);
    }
  }
  addComponentGeneration(codeDetails: CodeDetails, componentReadme: string, imageDetails: ImageDetails): void {
    this.addEntries(
      () => componentReadme,
      () => this.markdownImageCreator(imageDetails.componentImagePath, imageDetails.altText),
      () => this.createMarkdownCode(codeDetails.code, codeDetails.language)
    );
  }
  surroundWith(pre: string, post: string): void {
    if(post){
      this.componentsReadmeEntries.push([post]);
    }
    
    if (pre) {
      this.componentsReadmeEntries = [[pre]].concat(this.componentsReadmeEntries);
    }
    
  }
  toString(): string {
    return this.newlineSpacer(2, this.componentsReadmeEntries);
  }
  
}
