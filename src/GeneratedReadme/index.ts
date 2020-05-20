import { IGeneratedReadme, CodeDetails, ImageDetails } from "../interfaces";

export type MarkdownCodeCreator = (code:string,language:string)=>string
export type MarkdownImageCreator = (path:string,altText:string)=>string

export type NewlineSpacer = (numberOfNewlines:number,parts:Array<Array<string>>)=>string
export class GeneratedReadme implements IGeneratedReadme {
  private componentsReadmeEntries:Array<Array<string>> = [];
  imageBeforeCode!:boolean
  
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

  addComponentGeneration(codeDetails: CodeDetails|undefined, componentReadme: string|undefined, imageDetails: ImageDetails|undefined): void {
    const imageEntries = () => imageDetails===undefined?undefined:this.markdownImageCreator(imageDetails.componentImagePath, imageDetails.altText);
    const codeEntries = () => codeDetails===undefined?undefined:this.markdownCodeCreator(codeDetails.code,codeDetails.language);
    const second = this.imageBeforeCode?imageEntries:codeEntries;
    const third = this.imageBeforeCode?codeEntries:imageEntries;
    
    this.addEntries(
      () => componentReadme,
      second,
      third
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
