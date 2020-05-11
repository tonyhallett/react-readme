import { IGeneratedReadme, CodeDetails, ImageDetails } from "../interfaces";

export class GeneratedReadmeOld implements IGeneratedReadme {
  private readme: string = '';
  private isFirstComponentGeneration = true;
  private addLines() {
    this.readme += '\n\n';
  }
  private ensureSpaceBetweenComponentGeneration() {
    if (!this.isFirstComponentGeneration) {
      this.addLines();
    }
    this.isFirstComponentGeneration = false;
  }
  private addComponentReadme(componentReadme: string){
    if (componentReadme) {
      this.readme += componentReadme;
      this.addLines();
    }
  }
  addComponentGeneration(codeDetails: CodeDetails, componentReadme: string, imageDetails: ImageDetails): void {
    this.ensureSpaceBetweenComponentGeneration();
    this.addComponentReadme(componentReadme);
    this.createMarkdownImage(imageDetails.componentImagePath, imageDetails.altText);
    this.createMarkdownCode(codeDetails.code, codeDetails.language);
  }
  surroundWith(pre: string, post: string): void {
    if (pre) {
      const currentReadme = this.readme;
      this.readme = pre;
      this.addLines();
      this.readme += currentReadme;
    }
    if (post) {
      this.addLines();
      this.readme += post;
    }
  }
  toString(): string {
    return this.readme;
  }
  private createMarkdownCode(code: string, language: string):void {
    if(code){
      this.addLines();
      this.readme+= '```' + language + '\n' + code + '```';
    }
  }
  private createMarkdownImage(path: string, altText: string):void {
    path = path.replace(/\\/g, '/');
    path = encodeURI(`${path}`).replace(/[?#]/g, encodeURIComponent);
    const image = `![alt text](${path} "${altText}")`;
    this.readme+=image;
  }
}



export type MarkdownCodeCreator = (code:string,language:string)=>string
export type MarkdownImageCreator = (path:string,altText:string)=>string

export type NewlineSpacer = (numberOfNewlines:number,parts:Array<Array<string>>)=>string
export class GeneratedReadme implements IGeneratedReadme {
  private componentsReadmeEntries:Array<Array<string>> = [];
  
  constructor(
    private readonly markdownCodeCreator:MarkdownCodeCreator,
    private readonly markdownImageCreator:MarkdownImageCreator,
    private readonly newlineSpacer:NewlineSpacer
    ){

      //could have in ctor createAddEntries that would reorder the parts
    }

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
