import generate from '../src/generate'
import { AssetManager, AssetFolderProvider } from '../src/AssetManager'
import { AssetManagerOptions } from '../src/AssetManagerOptions'
import { IRequirer, IReactReadme, IPuppeteerImageGeneratorWriter } from '../src/interfaces'
import { SuffixComponentSorter } from '../src/SuffixComponentSorter'
import { GeneratedReadme} from '../src/GeneratedReadme'
import { GeneratedReadmeWriter} from '../src/GeneratedReadmeWriter'
import { System} from '../src/System' 
import * as fs from 'fs-extra';
import * as path from 'path';


describe('generate', () => {
  describe('no props', () => {
    let cleanUp:()=>Promise<void>;
    it('works', async () => {
      class ReadmeAssetsFolder{
        constructor(private readonly path:string){}
        create():Promise<void> {
          fs.ensureDir(path.join(process.cwd(),this.path));
          throw new Error();
        }
        remove():Promise<void>{
          return fs.remove(this.path);
        }
      }
      const readmeAssetsFolder = new ReadmeAssetsFolder('README-assets');
      const generatedReadme = 'GeneratedREADME.md';
      cleanUp = async () => {
        await fs.remove(path.join(process.cwd(),generatedReadme));
        await readmeAssetsFolder.remove();
      };
      


      const system = new System();
      const requirer:IRequirer = {require:()=>({})}
      const reactReadme:IReactReadme = {
        exists:()=>Promise.resolve(false),
      } as any;
      const generateAndWrite = jest.fn().mockReturnValue(Promise.resolve());
      const puppeteerImageGenerator:IPuppeteerImageGeneratorWriter = {
        generateAndWrite
      }
      //should add something to images to check that it does clean it
      await generate(
        new AssetManager(
          new AssetManagerOptions(system, reactReadme), 
          new AssetFolderProvider(system,requirer,reactReadme,new SuffixComponentSorter()),
          system),
        new GeneratedReadme(),
        new GeneratedReadmeWriter(system,generatedReadme),
        puppeteerImageGenerator
      );
    },10000)

    afterAll(async () => {
      await cleanUp();
    })
  })
})