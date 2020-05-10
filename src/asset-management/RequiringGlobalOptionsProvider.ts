import { GlobalRootOptions } from "./AssetManagerOptions";
import { ReactReadmeRequirer } from "../ReactReadmeRequirer";
import { IGlobalOptionsProvider } from "./IOptionsProvider";
export class RequiringGlobalOptionsProvider implements IGlobalOptionsProvider {
  constructor(private readonly reactReadme: ReactReadmeRequirer) { }
  async getOptions(folderPath: string): Promise<GlobalRootOptions | undefined> {
    if (await this.reactReadme.exists(folderPath)) {
      return this.reactReadme.read<GlobalRootOptions>(folderPath);
    }
  }
}
