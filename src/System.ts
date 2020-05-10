import { ISystem, Path, FS } from "./interfaces";
import * as path from 'path'
import * as fs from 'fs-extra';
import { readFileString, readUntilExists } from "./helpers";

export class System implements ISystem{
  path:Path = {
    exists:(filePath:string) => fs.pathExists(filePath),
    extname:(file:string) => path.extname(file),
    isAbsolute:(filePath:string) => path.isAbsolute(filePath),
    join:(...paths:string[]) => path.join(...paths),
    absoluteOrCwdJoin:(filePath:string) => {
      if(this.path.isAbsolute(filePath)){
        return filePath;
      }
      return path.join(this.cwd,filePath);
    },
    relative:(from:string,to:string) => path.relative(from,to)
  }
  fs:FS = {
    emptyDir:(dir:string) => fs.emptyDir(dir),
    readFileString:(filePath:string) => readFileString(filePath),
    readUntilExists:(...paths:string[]) => readUntilExists(...paths),
    readdir:(dir:string) => fs.readdir(dir),
    writeFileString:(path:string,data:string) => fs.writeFile(path,data),
    writeFileBuffer:(path:string,data:Buffer) => fs.writeFile(path,data)
  }
  cwd = process.cwd()
}


