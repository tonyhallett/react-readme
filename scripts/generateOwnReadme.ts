import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';
import { generateReadme }   from '../src/index';
import {createColoredLinebreakedSeparatorCreator} from '../src/asset-management/separaterHelpers'

//914 is readme width in github on laptop
const lineBreakedSeparatorCreator = createColoredLinebreakedSeparatorCreator(914,10);
const red = '8c1925';
const green = '80eb34';
const yellow = 'effa20';
const orange = 'e89733';
const blue = '343ae3';


const readmeAssetsPath = path.join(__dirname, '..','README-assets');
async function cleanReadmeAssets(){
  await fs.emptyDir(readmeAssetsPath);
  const generatedReadmePath =  path.join(__dirname, '..','README.md');
  await fs.remove(generatedReadmePath)
}
function ensureReadmeAssets(){
  return fs.ensureDir(readmeAssetsPath);
}
function readmeAssetsJoin(...paths:string[]){
  return path.join(readmeAssetsPath,...paths);
}
function createRootReadmes(pre:string,post:string){
  return Promise.all([[pre,'Pre'],[post,'Post']].map(readme => {
    const path = readmeAssetsJoin(`README${readme[1]}.md`);
    return fs.writeFile(
      path,
      readme[0],
      'utf8');
  }));
}
async function createRootReactReadme(ts:string){
  const path = readmeAssetsJoin(`react-readme.ts`);
  await fs.writeFile(
    path,
    ts,
    'utf8');
  return path;
};

function compile(reactReadmes:string[]){
  const program =  ts.createProgram(
    reactReadmes,
    {
      esModuleInterop:true,
      module:ts.ModuleKind.CommonJS,
      target:ts.ScriptTarget.ES2015,
      jsx:ts.JsxEmit.React
    });
  
  program.emit();
}
interface ComponentFolder{
  name:string,
  reactReadmeTsx:string,
  readme:string
}
async function generateComponentFolder(componentFolder:ComponentFolder):Promise<string>{
  const componentPath = readmeAssetsJoin('components',componentFolder.name);
  await fs.ensureDir(componentPath);
  const componentReactReadmePath = readmeAssetsJoin('components',componentFolder.name,'react-readme.tsx');
  await fs.writeFile(componentReactReadmePath,componentFolder.reactReadmeTsx,'utf8');
  const componentReadmePath = readmeAssetsJoin('components',componentFolder.name,'README.md');
  await fs.writeFile(componentReadmePath,componentFolder.readme,'utf8');
  return componentReactReadmePath;
}
async function createReadmeAssets(
  pre:string,
  post:string,
  rootReactReadmeTs:string,
  componentFolders:ComponentFolder[]){
  await cleanReadmeAssets();
  await ensureReadmeAssets();
  await createRootReadmes(pre, post);

  const rootReactReadme = await createRootReactReadme(rootReactReadmeTs);
  const componentReadmes = await Promise.all(componentFolders.map(cf => generateComponentFolder(cf)));
  compile([rootReactReadme].concat(componentReadmes));
}
async function createAndGenerate(pre:string,
  post:string,
  rootReactReadmeTs:string,
  componentFolders:ComponentFolder[]){
    await createReadmeAssets(pre,post,rootReactReadmeTs,componentFolders);
    await generateReadme();
  }

async function demo1():Promise<void>{
  try{
    await createAndGenerate('pre','post',
    `export = {
      separators:{
        first:'${lineBreakedSeparatorCreator(red,true)}',
        last:'${lineBreakedSeparatorCreator(blue,false)}',
        componentSeparator:'${lineBreakedSeparatorCreator(orange,false)}',
        componentPropsSeparator:'${lineBreakedSeparatorCreator(yellow,false)}',
        propsSeparator:'${lineBreakedSeparatorCreator(green,false)}'
      }
    }`,[
      {
        name:'Component1',
        readme:'Component1 readme',
        reactReadmeTsx:'' + 
`
import * as React from 'react';
export = {
  component:()=>{
    return <div style={{color:'white'}}>Component1</div>
  }
}`
      },
      {
        name:'Component_WithProps',
        readme:'Component with props readme',
        reactReadmeTsx:'' + 
`
import * as React from 'react';
export = {
  component:({color}:{color:string})=>{
    return <div style={{color:color}}>Coloured by props</div>
  },
  props:[[{color:'red'},{readme:'Red props'}],[{color:'orange'},{readme:'Orange props'}],[{color:'green'},{readme:'Green props'}]]
}`
      }
    ])}
  catch(e){
    console.log(e.message);
  }
}
demo1();