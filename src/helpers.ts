import * as fs from 'fs-extra';

export function readFileString(path:string){
  return fs.readFile(path,'utf8');
}
export async function readUntilExists(...paths:string[]){
  let read = '';
  let didRead = false;
  if(paths.length===0){
    return Promise.resolve({read,didRead,readPath:undefined});
  }
  for(let i=0;i<paths.length;i++){
    const path = paths[i];
    if(await fs.pathExists(path)){
      read = await readFileString(path);
      didRead = true;
      return {
        read,
        didRead,
        readPath:path
      }
    }
  }
  return Promise.resolve({read,didRead,readPath:undefined});
}