import { IGeneratedReadmeWriter, IGeneratedReadme, ISystem } from "./interfaces";

export class GeneratedReadmeWriter implements IGeneratedReadmeWriter {
  private writePath:string
  constructor(private readonly system:ISystem,private readonly readmeFileName:string){
    this.writePath = this.system.path.absoluteOrCwdJoin(this.readmeFileName);
  }
  getRelativePath(to: string): string {
    return this.system.path.relative(this.writePath,to);
  }
  write(readme: IGeneratedReadme):Promise<void> {
    return this.system.fs.writeFileString(this.writePath,readme.toString());
  }
  
}