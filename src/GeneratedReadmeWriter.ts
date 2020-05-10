import { IGeneratedReadmeWriter, IGeneratedReadme, ISystem } from "./interfaces";

export class GeneratedReadmeWriter implements IGeneratedReadmeWriter {
  constructor(private readonly system:ISystem,private readonly readmeFileName:string /* for testing purposes*/){}
  getRelativePath(to: string): string {
    return this.system.path.relative(this.system.cwd,to);
  }
  write(readme: IGeneratedReadme):Promise<void> {
    return this.system.fs.writeFileString(this.system.path.join(this.system.cwd,this.readmeFileName),readme.toString());
  }
  static create(system:ISystem){
    return new GeneratedReadmeWriter(system,'README.md');
  }
}