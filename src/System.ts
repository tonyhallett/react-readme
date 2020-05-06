import { ISystem, Path, FS } from "./interfaces";
import * as path from 'path'
import * as fs from 'fs-extra';
import { readFileString, readUntilExists } from "./helpers";

export class System implements ISystem{
  path:Path = {
    exists:(filePath:string) => fs.pathExists(filePath),
    extname:(file:string) => path.extname(file),
    isAbsolute:(path:string) => (path as any).isAbsolute(path),
    join:(...paths:string[]) => path.join(...paths),
    absoluteOrCwdRelative:(filePath:string) => {
      if(this.path.isAbsolute(filePath)){
        return filePath;
      }
      return path.resolve(filePath);
    }
  }
  fs:FS = {
    emptyDir:(dir:string) => fs.emptyDir(dir),
    readFileString:(filePath:string) => readFileString(filePath),
    readUntilExists:(...paths:string[]) => readUntilExists(...paths),
    readdir:(dir:string) => fs.readdir(dir)
  }
  cwd = process.cwd()

}


