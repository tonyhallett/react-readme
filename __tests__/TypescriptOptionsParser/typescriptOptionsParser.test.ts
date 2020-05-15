import * as path from 'path';
import * as fs from 'fs-extra';
import {TypescriptOptionsParser} from '../../src/asset-management/TypescriptOptionsParser'
import {System} from '../../src/System'

describe('TypescriptOptionsParser', () => {
  const allTestCodeDirectory = path.join(__dirname,'code');
  afterAll(()=>{
    return fs.remove(allTestCodeDirectory);
  }) 
  interface CodeFile{
    contents:string,
    name:string
  }
  interface TypescriptOptionsParserComponentTest{
    description:string,
    expectedComponentText:string,
    file:CodeFile,
    requiredFile?:CodeFile
    
  }
  function getExportsEquals(isJs:boolean,equalTo:string){
    const exports = isJs?'module.exports':'export';
    return `${exports} = ${equalTo}`;
  }
  function getObjectLiteral(component:string,props:string){
    return `{
      ${component},
      ${props}
    }`
  }
  function getExportsEqualsObjectLiteralFile(isJs:boolean,component:string,props:string,pre?:string){
    const equalTo = getObjectLiteral(component,props);
    const file = `
${pre?pre:''}
${getExportsEquals(isJs,equalTo)}
  `;

    return file;
  }
  function getExportsEqualVariable(isJs:boolean,component:string,props:string){
    const objectLiteral = getObjectLiteral(component,props);
    const file = `
    const exportsVariable = ${objectLiteral};
    ${getExportsEquals(isJs,'exportsVariable')}
    `;
    return file;
  }

  function getJsTsTests(isJs:boolean){
    const name = isJs?'react-readme.js':'react-readme.tsx';
    const componentFunctionPropertyTest:TypescriptOptionsParserComponentTest=(()=> {
      const functionComponent = '' +
  `function (){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserComponentTest={
        description:'Component function property',
        expectedComponentText:functionComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`component: ${functionComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
    const componentArrowFunctionPropertyTest:TypescriptOptionsParserComponentTest=(()=> {
      const arrowFunctionComponent = '' +
  `() => {
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserComponentTest={
        description:'Component arrow function property',
        expectedComponentText:arrowFunctionComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`component: ${arrowFunctionComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
    const componentClassPropertyTest:TypescriptOptionsParserComponentTest=(()=> {
      const classComponent = '' +
  `class Component {
    render(){
      return null;
    }
  }`
  
      const test:TypescriptOptionsParserComponentTest={
        description:'Component class function property',
        expectedComponentText:classComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`component: ${classComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
    
    const componentMethodTest:TypescriptOptionsParserComponentTest=(()=> {
      const methodComponent = '' +
  `component(){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserComponentTest={
        description:'Component method',
        expectedComponentText:methodComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`${methodComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
  
  
    // require the type checker
    const componentVariableTest:TypescriptOptionsParserComponentTest=(()=> {
      const functionComponent = '' +
  `function (){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserComponentTest={
        description:'Component function property',
        expectedComponentText:functionComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,'component: componentVariable','props:[]',`const componentVariable = ${functionComponent}`),
          name
        }
      }
      return test;
    })();
    const shorthandAssignmentTest:TypescriptOptionsParserComponentTest=(()=> {
      const functionComponent = '' +
  `function (){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserComponentTest={
        description:'Component function property',
        expectedComponentText:functionComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,'component','props:[]',`const component = ${functionComponent}`),
          name
        }
      }
      return test;
    })();
    const exportsEqualsVariableTest:TypescriptOptionsParserComponentTest = (()=> {
      const methodComponent = '' +
  `component(){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserComponentTest={
        description:'module.exports = someVar',
        expectedComponentText:methodComponent,
        file:{
          contents:getExportsEqualVariable(isJs,`${methodComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
    const tests = [
      componentFunctionPropertyTest,
      componentArrowFunctionPropertyTest,
      componentClassPropertyTest,
      componentMethodTest,
      componentVariableTest,
      shorthandAssignmentTest,
      exportsEqualsVariableTest
    ]
    tests.forEach(t => t.description += isJs?' JS':' TSX');
    return tests;
  }
  function createRequiringTest(isJs:boolean){
    const extension = isJs?'js':'tsx';
    const requireLine = isJs ? `const required = require('./required').required;`:
    `import {required} from './required';`
    const requiringTest:TypescriptOptionsParserComponentTest = (()=> {
      const methodComponent = '' +
  `component(){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserComponentTest={
        description:`Requiring ${extension}`,
        expectedComponentText:methodComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`${methodComponent}`,'props:[]',requireLine),
          name:`react-readme.${extension}`
        },
        requiredFile:{
          contents:isJs?`exports.required='Required'`:`export const required='Required'`,
          name:'required.${extension}'
        }
      }
      return test;
    })();
    return requiringTest;
  }
  
  const tests:TypescriptOptionsParserComponentTest[] = [
    ...getJsTsTests(false),
    ...getJsTsTests(true),
    createRequiringTest(true),
    createRequiringTest(false)
  ];
  tests.forEach( (test,i) => {
    it(test.description, async () => {
      const testCodeDirectory = path.join(allTestCodeDirectory,`test${i}`);
      await fs.ensureDir(testCodeDirectory);
      const filesToWrite = [test.file];
      if(test.requiredFile){
        filesToWrite.push( test.requiredFile);
      }
      await Promise.all(filesToWrite.map(f=>{
        return fs.writeFile(path.join(testCodeDirectory,f.name),f.contents,'utf8')
      }));
      const typescriptOptionsParser = new TypescriptOptionsParser(new System());
      const componentCode = typescriptOptionsParser.getComponentCode(path.join(testCodeDirectory,test.file.name));
      expect(componentCode).toBe(test.expectedComponentText);
    })
  })
  
})