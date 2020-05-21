import { createMarkdownImageCreator } from "../GeneratedReadme/readMePartCreators";
import { encoder } from "../GeneratedReadme/Encoder";
const svgToMiniDataURI = require('mini-svg-data-uri');

const imageCreator = createMarkdownImageCreator(encoder);

//https://placeholder.com/
export function createColoredSeparator(width:number,height:number,color:string){
  return imageCreator(`https://via.placeholder.com/${width}x${height}/${color}/${color}`,'')
}
export function createColoredSeparatorCreator(width:number,height:number){
  return (color:string) => createColoredSeparator(width,height,color);
}
export function createColoredLinebreakedSeparatorCreator(width:number,height:number){
  const creator = createColoredSeparatorCreator(width,height);
  return (color:string,isFirst = false) => {
    const separator = creator(color);
    return separate(separator,isFirst);
  }
}
function separate(readme:string,isFirst=false){
  if(isFirst){
    return '\\n\\n' + readme;
  }
  return readme + '\\n\\n';
}

export function svgSeparator(height:number,color:string){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${height}px" viewBox="0 0 100 ${height}" preserveAspectRatio="none">
  <rect fill="${color}" width="100" height="${height}" />
</svg>`
}

export function createWidthExpandingColoredDataSVGSeparator(height:number){
  return (color:string) => svgToMiniDataURI(svgSeparator(height,color));
}

export function createWidthExpandingLineBreakedColoredDataSVGSeparator(height:number){
  const widthExpandingColoredDataSVGSeparator=createWidthExpandingColoredDataSVGSeparator(height);
  return (color:string,isFirst = false) => {
    const datauri = widthExpandingColoredDataSVGSeparator(color);
    const separator = `<img src="${datauri}"/>`
    return separate(separator,isFirst);
  }
}