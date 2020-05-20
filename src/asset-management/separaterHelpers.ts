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


function btoa(str:string|Buffer) {
  var buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = Buffer.from(str.toString(), 'binary');
  }

  return buffer.toString('base64');
}
function svgToDataUri(svg:string){
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function createWidthExpandingColoredDataSVGSeparator(height:number){
  return (color:string) => svgToDataUri('' + 
`<svg width="100%" height='${height}px' viewBox="0 0 100 ${height}" preserveAspectRatio="none">
  <rect fill="${color}" width="100" height="${height}" />
</svg>`
  )
}

//todo separate is common
export function createWidthExpandingLineBreakedColoredDataSVGSeparator(height:number){
  const widthExpandingColoredDataSVGSeparator=createWidthExpandingColoredDataSVGSeparator(height);
  return (color:string,isFirst = false) => {
    const datauri = widthExpandingColoredDataSVGSeparator(color);
    //image creator already encodes
    //const separator = imageCreator(datauri,'');
    const separator = `![alt text](${datauri} "")`;
    return separate(separator,isFirst);
  }
}