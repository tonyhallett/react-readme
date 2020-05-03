import { IGeneratedReadmeWriter, IGeneratedReadme } from "./interfaces";
import path from "path";
import * as fs from 'fs-extra';

export class GeneratedReadmeWriter implements IGeneratedReadmeWriter {
  getRelativePath(to: string): string {
    return path.relative(process.cwd(), to);
  }
  async write(readme: IGeneratedReadme) {
    await fs.writeFile(path.join(process.cwd(), 'README.md'), readme.toString());
  }
}
