import * as fs from 'fs-extra';

export function readFileString(path:string):Promise<string>{
  return fs.readFile(path,'utf8');
}
export interface ReadUntilExistsResult{
  didRead:boolean,
  read:string|undefined,
  readPath:string|undefined
}
export async function readUntilExists(...paths:string[]):Promise<ReadUntilExistsResult>{
  for(let i=0;i<paths.length;i++){
    const path = paths[i];
    if(await fs.pathExists(path)){
      const read = await readFileString(path);
      return {
        read,
        didRead:true,
        readPath:path
      }
    }
  }
  return Promise.resolve({read:undefined,didRead:false,readPath:undefined});
}