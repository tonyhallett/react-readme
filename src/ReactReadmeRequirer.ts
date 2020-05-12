import { IReactReadme } from "./interfaces";
import { ISystem } from "./interfaces";
import { IRequirer } from "./interfaces";
import { pathExists } from "fs-extra";


export class ReactReadmeRequirer implements IReactReadme{
  private readonly reactReadmeFile = 'react-readme.js'
  constructor(private readonly system:ISystem,private readonly requirer:IRequirer){}

  getReactReadmeInFolder(folderPath:string){
    return this.system.path.join(folderPath,this.reactReadmeFile);
  }
  exists(folderPath: string): Promise<boolean> {
    return this.system.path.exists(this.getReactReadmeInFolder(folderPath));
  }
  read<T extends object>(folderPath: string):T {
    const path = this.getReactReadmeInFolder(folderPath);
    try{
      return this.requirer.require(path);
    }catch(e){
      console.log(e.message);
      throw new Error(`error requiring ${path}`);
    }
  }

}