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
  interface TypescriptOptionsParserTest{
    description:string,
    expectedText:string|string[],
    isPropsTest?:true,
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
  function getExportsEqualVariable(isJs:boolean,component:string,props:string,pre?:string){
    const objectLiteral = getObjectLiteral(component,props);
    const file = `
    ${pre?pre:''}
    const exportsVariable = ${objectLiteral};
    ${getExportsEquals(isJs,'exportsVariable')}
    `;
    return file;
  }

  function getJsTsTests(isJs:boolean){
    const name = isJs?'react-readme.js':'react-readme.tsx';
    

    const oneOfEachPropsTest:TypescriptOptionsParserTest = {
      description:'First props second tuple with options',
      file:{
        name,
        contents:getExportsEqualsObjectLiteralFile(isJs,'component: 1',`props:[
          {prop1:1},
          [{prop2:2},{option:'some option'}]
        ]`)
      },
      isPropsTest:true,
      expectedText:['{prop1:1}','{prop2:2}']
    }
  
    const propsVariableTest:TypescriptOptionsParserTest = {
      description:'First props second tuple with options',
      file:{
        name,
        contents:getExportsEqualsObjectLiteralFile(isJs,'component: 1',`props:propsVariable`,`
        const propsVariable = [
          {prop1:1},
          [{prop2:2},{option:'some option'}]
        ];
        `)},
      isPropsTest:true,
      expectedText:['{prop1:1}','{prop2:2}']
    }
    const propsVariableShorthandTest:TypescriptOptionsParserTest = {
      description:'props shorthand reference',
      file:{
        name,
        contents:getExportsEqualsObjectLiteralFile(isJs,'component: 1',`props`,`
        const props = [
          {prop1:1},
          [{prop2:2},{option:'some option'}]
        ];
        `)
      },
      isPropsTest:true,
      expectedText:['{prop1:1}','{prop2:2}']
    }
    const propsReferenceTest:TypescriptOptionsParserTest = {
      description:'Referenced props',
      file:{
        name,
        contents:getExportsEqualsObjectLiteralFile(isJs,'component: 1','props:[referencedProps]',`
        const referencedProps = {prop1:1};
        `)
      },
      isPropsTest:true,
      expectedText:['{prop1:1}']
    }
    const propsWithOptionsReferenceTest:TypescriptOptionsParserTest = {
      description:'Referenced props in tuple',
      file:{
        name,
        contents:getExportsEqualsObjectLiteralFile(isJs,'component: 1','props:[[referencedProps,options:{}]]',`
        const referencedProps = {prop1:1};
        `)
      },
      isPropsTest:true,
      expectedText:['{prop1:1}']
    }
    
    const propsDoubleReference:TypescriptOptionsParserTest = {
      description:'Double reference',
      file:{
        name,
        contents: getExportsEqualVariable(isJs,'component:1','props:[referencedProps,[referencedPropsInTuple,options:{}]]',`
        const referencedProps = {prop1:1};
        const referencedPropsInTuple = {prop2:2};
        `)
      },
      isPropsTest:true,
      expectedText:['{prop1:1}','{prop2:2}']
    }
    const componentFunctionPropertyTest:TypescriptOptionsParserTest=(()=> {
      const functionComponent = '' +
  `function (){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserTest={
        description:'Component function property',
        expectedText:functionComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`component: ${functionComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
    const componentArrowFunctionPropertyTest:TypescriptOptionsParserTest=(()=> {
      const arrowFunctionComponent = '' +
  `() => {
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserTest={
        description:'Component arrow function property',
        expectedText:arrowFunctionComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`component: ${arrowFunctionComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
    const componentClassPropertyTest:TypescriptOptionsParserTest=(()=> {
      const classComponent = '' +
  `class Component {
    render(){
      return null;
    }
  }`
  
      const test:TypescriptOptionsParserTest={
        description:'Component class function property',
        expectedText:classComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`component: ${classComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
    
    const componentMethodTest:TypescriptOptionsParserTest=(()=> {
      const methodComponent = '' +
  `component(){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserTest={
        description:'Component method',
        expectedText:methodComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,`${methodComponent}`,'props:[]'),
          name
        }
      }
      return test;
    })();
  
  
    // require the type checker
    const componentVariableTest:TypescriptOptionsParserTest=(()=> {
      const functionComponent = '' +
  `function (){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserTest={
        description:'Component function property',
        expectedText:functionComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,'component: componentVariable','props:[]',`const componentVariable = ${functionComponent}`),
          name
        }
      }
      return test;
    })();
    const shorthandAssignmentTest:TypescriptOptionsParserTest=(()=> {
      const functionComponent = '' +
  `function (){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserTest={
        description:'Component function property',
        expectedText:functionComponent,
        file:{
          contents:getExportsEqualsObjectLiteralFile(isJs,'component','props:[]',`const component = ${functionComponent}`),
          name
        }
      }
      return test;
    })();
    const exportsEqualsVariableTest:TypescriptOptionsParserTest = (()=> {
      const methodComponent = '' +
  `component(){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserTest={
        description:'module.exports = someVar',
        expectedText:methodComponent,
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
      exportsEqualsVariableTest,
      oneOfEachPropsTest,
      propsVariableTest,
      propsVariableShorthandTest,
      propsReferenceTest,
      propsWithOptionsReferenceTest,
      propsDoubleReference
    ]
    tests.forEach(t => t.description += isJs?' JS':' TSX');
    return tests;
  }
  function createRequiringTest(isJs:boolean){
    const extension = isJs?'js':'tsx';
    const requireLine = isJs ? `const required = require('./required').required;`:
    `import {required} from './required';`
    const requiringTest:TypescriptOptionsParserTest = (()=> {
      const methodComponent = '' +
  `component(){
    // for js - React.createElement
    // for tsx - <div/>
  }`
  
      const test:TypescriptOptionsParserTest={
        description:`Requiring ${extension}`,
        expectedText:methodComponent,
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

  //will make a jsts test
  const oneOfEachPropsTest:TypescriptOptionsParserTest = {
    description:'First props second tuple with options',
    file:{
      name:'react-readme.js',
      contents:`
      module.exports = {
        props:[
          {prop1:1},
          [{prop2:2},{option:'some option'}]
        ]
      }
      `
    },
    isPropsTest:true,
    expectedText:['{prop1:1}','{prop2:2}']
  }

  const propsVariableTest:TypescriptOptionsParserTest = {
    description:'First props second tuple with options',
    file:{
      name:'react-readme.js',
      contents:`
      const propsVariable = [
        {prop1:1},
        [{prop2:2},{option:'some option'}]
      ];
      module.exports = {
        props:propsVariable
      }
      `
    },
    isPropsTest:true,
    expectedText:['{prop1:1}','{prop2:2}']
  }
  const propsVariableShorthandTest:TypescriptOptionsParserTest = {
    description:'props shorthand reference',
    file:{
      name:'react-readme.js',
      contents:`
      const props = [
        {prop1:1},
        [{prop2:2},{option:'some option'}]
      ];
      module.exports = {
        props
      }
      `
    },
    isPropsTest:true,
    expectedText:['{prop1:1}','{prop2:2}']
  }
  const propsReferenceTest:TypescriptOptionsParserTest = {
    description:'Referenced props',
    file:{
      name:'react-readme.js',
      contents:`
      const referencedProps = {prop1:1};
      module.exports = {
        props:[referencedProps]
      }
      `
    },
    isPropsTest:true,
    expectedText:['{prop1:1}']
  }
  const propsWithOptionsReferenceTest:TypescriptOptionsParserTest = {
    description:'Referenced props in tuple',
    file:{
      name:'react-readme.js',
      contents:`
      const referencedProps = {prop1:1};
      module.exports = {
        props:[[referencedProps,options:{}]]
      }
      `
    },
    isPropsTest:true,
    expectedText:['{prop1:1}']
  }
  
  const propsDoubleReference:TypescriptOptionsParserTest = {
    description:'Double reference',
    file:{
      name:'react-readme.js',
      contents:`
      const referencedProps = {prop1:1};
      const referencedPropsInTuple = {prop2:2};
      const theExport = {
        props:[referencedProps,[referencedPropsInTuple,options:{}]]
      }
      module.exports = theExport
      `
    },
    isPropsTest:true,
    expectedText:['{prop1:1}','{prop2:2}']
  }
  
  const tests:TypescriptOptionsParserTest[] = [
    ...getJsTsTests(false),
    ...getJsTsTests(true),
    createRequiringTest(true),
    createRequiringTest(false)
    //oneOfEachPropsTest
    //propsVariableTest
    //propsReferenceTest
    //propsWithOptionsReferenceTest
    //propsDoubleReference,
    //propsVariableShorthandTest
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
      let parsed:string|string[]|undefined;
      if(test.isPropsTest){
        parsed = typescriptOptionsParser.getPropsCode(path.join(testCodeDirectory,test.file.name),test.file.contents);
      }else{
        parsed = typescriptOptionsParser.getComponentCode(path.join(testCodeDirectory,test.file.name),test.file.contents);
      }
      
      expect(parsed).toEqual(test.expectedText);
    })
  })
  
})