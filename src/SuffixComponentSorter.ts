import { IComponentSorter, SortedComponentFolder } from "./asset-management/AssetFolderProvider";

export class SuffixComponentSorter implements IComponentSorter{
  sort(componentFolderNames: string[]): SortedComponentFolder[] {
    const sorted:SortedComponentFolder[] = [];
    const unsorted:SortedComponentFolder[] = [];
    for(let i=0;i<componentFolderNames.length;i++){
      const componentFolderName = componentFolderNames[i];
      const {index,parsedName} = this.parseName(componentFolderName);
      if(index>-1){
        sorted[index] = {componentFolderName,parsedName};
      }else{
        unsorted.push({componentFolderName,parsedName})
      }
    }
    return sorted.filter(s=>s!==undefined).concat(unsorted);
  }
  private parseName(name:string):{parsedName:string,index:number}{
    let index = -1;
    let parsedName = name;
    const suffixIndex = name.indexOf('_');
    if(suffixIndex>0){
      parsedName =  name.substr(0,suffixIndex);
      index = Number.parseInt(name.substring(suffixIndex+1));
    }
    return {
      parsedName,
      index
    }
  }

}