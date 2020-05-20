import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';
import { generateReadme }   from '../src/index';
import {createColoredLinebreakedSeparatorCreator,createWidthExpandingLineBreakedColoredDataSVGSeparator} from '../src/asset-management/separaterHelpers'


const lineBreakedSeparatorCreator = createColoredLinebreakedSeparatorCreator(700,10);
const red = '8c1925';
const orange = '80eb34';
const yellow = 'effa20';
const blue = 'e89733';
const green = '343ae3';

const cyanSvgSeparator = createWidthExpandingLineBreakedColoredDataSVGSeparator(10)('cyan');

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
      //declaration:true,
      esModuleInterop:true,
      module:ts.ModuleKind.CommonJS,
      target:ts.ScriptTarget.ES2015,
      jsx:ts.JsxEmit.React
    });
  
  program.emit();
}
interface ComponentFolder{
  name:string,
  reactReadmeTsx:string
}
async function generateComponentFolder(componentFolder:ComponentFolder):Promise<string>{
  const componentPath = readmeAssetsJoin('components',componentFolder.name);
  await fs.ensureDir(componentPath);
  const componentReactReadmePath = readmeAssetsJoin('components',componentFolder.name,'react-readme.tsx');
  await fs.writeFile(componentReactReadmePath,componentFolder.reactReadmeTsx,'utf8');
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

const inlineStyle = '<style type="text/css">p {color:red;}</style><p>okay</p>'

async function demo1():Promise<void>{
  try{
    await createAndGenerate('pre','post',
    `export = {
      separators:{
        first:'${lineBreakedSeparatorCreator(red,true)}',
        last:\`${cyanSvgSeparator}\`,
        //last:'${inlineStyle}\\n\\n',
        componentSeparator:'${lineBreakedSeparatorCreator(orange,false)}',
        componentPropsSeparator:'${lineBreakedSeparatorCreator(yellow,false)}',
        propsSeparator:'${lineBreakedSeparatorCreator(green,false)}'
      }
    }`,[
      {
        name:'Component1',
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