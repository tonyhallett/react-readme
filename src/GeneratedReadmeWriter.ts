import { IGeneratedReadmeWriter, IGeneratedReadme, ISystem } from "./interfaces";

export class GeneratedReadmeWriter implements IGeneratedReadmeWriter {
  constructor(private readonly system:ISystem,private readonly readmeFileName:string){}
  getRelativePath(to: string): string {
    return this.system.path.relative(this.system.cwd,to);
  }
  write(readme: IGeneratedReadme):Promise<void> {
    return this.system.fs.writeFile(this.system.path.absoluteOrCwdJoin(this.readmeFileName),readme.toString());
  }
  
}