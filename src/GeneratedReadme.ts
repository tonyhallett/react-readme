import { IGeneratedReadme, CodeDetails, ImageDetails } from "./interfaces";
import fileUrl from 'file-url'

export class GeneratedReadme implements IGeneratedReadme {
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
  addComponentGeneration(codeDetails: CodeDetails, componentReadme: string, imageDetails: ImageDetails): void {
    this.ensureSpaceBetweenComponentGeneration();
    if (componentReadme) {
      this.readme += componentReadme;
      this.addLines();
    }
    this.readme+=this.createMarkdownImage(imageDetails.componentImagePath, imageDetails.altText);
    if(codeDetails.language){
      this.addLines();
      this.readme+=this.createMarkdownCode(codeDetails.code, codeDetails.language);
    }
    
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
  private createMarkdownCode(code: string, language: string):string {
    return '```' + language + '\n' + code + '```';
  }
  private createMarkdownImage(path: string, altText: string):string {
    path = path.replace(/\\/g, '/');
    path = encodeURI(`${path}`).replace(/[?#]/g, encodeURIComponent);
    return `![alt text](${path} "${altText}")`;
  }
}
