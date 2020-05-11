import {NewlineSpacer} from './index';

function getNewlines(numberOfNewlines:number):string {
  let newlines = '';
  for(let i=0;i<numberOfNewlines;i++){
    newlines+='\n';
  }
  return newlines;
}
export const newlineSpacer:NewlineSpacer = (numberOfNewlines,parts) => {
  let result = '';
  const newlines = getNewlines(numberOfNewlines);
  
  function isLast(partNum:number,isLastEntry:boolean):boolean{
    let last = false;
    const isLastPart = partNum===parts.length-1;
    if(isLastPart && isLastEntry){
      last = true;
    }
    return last;
  }
  for(let i=0;i<parts.length;i++){
    const part = parts[i];
    const partLength = part.length;
    for(let j=0;j<partLength;j++){
      result += part[j];
      const isLastEntry = j===partLength-1;
      if(!isLast(i,isLastEntry)){
        result += newlines;
      }
    }
  }
  return result;
}