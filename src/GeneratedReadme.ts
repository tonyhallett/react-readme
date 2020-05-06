import { IGeneratedReadme, CodeDetails, ImageDetails } from "./interfaces";

export class GeneratedReadme implements IGeneratedReadme {
  private readme: string = '';
  private isFirstDemo = true;
  private addLines() {
    this.readme += '\n\n';
  }
  private ensureSpace() {
    if (!this.isFirstDemo) {
      this.addLines();
    }
    this.isFirstDemo = false;
  }
  addDemo(codeDetails: CodeDetails, componentReadme: string, imageDetails: ImageDetails): void {
    this.ensureSpace();
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
  private createMarkdownCode(code: string, language: string) {
    return '```' + language + '\n' + code + '```';
  }
  private createMarkdownImage(path: string, altText: string) {
    return `![alt text](${path} "${altText}")`;
  }
}
