export interface Encoder{
  encodeURI:typeof encodeURI,
   encodeURIComponent:typeof  encodeURIComponent
}
export function createMarkdownImageCreator(encoder:Encoder){
  return (path: string, altText: string):string => {
    path = path.replace(/\\/g, '/');
    path = encoder.encodeURI(`${path}`).replace(/[?#]/g, encoder.encodeURIComponent);
    return `![alt text](${path} "${altText}")`;
  }
}

export function markdownCodeCreator(code:string,language:string){
  return '```' + language + '\n' + code + '\n' + '```'
}