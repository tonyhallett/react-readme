import * as ts from 'typescript';
import fs = require("fs");
import path = require("path");

describe('parsing typescript ( tsx )', () => {
  function getModuleExportsEqualsObjectLiteralExpression(sourceFile:ts.SourceFile,isJs:boolean):ts.ObjectLiteralExpression|undefined{
    let moduleExportsEqualsObjectLiteralExpression:ts.ObjectLiteralExpression|undefined;
    const potentials = sourceFile!.statements.map(s=>{
      if(isJs){
        if(ts.isExpressionStatement(s) && ts.isBinaryExpression(s.expression)){
          const b= s.expression;
          if(ts.isPropertyAccessExpression(b.left)&&ts.isIdentifier(b.left.expression) && b.left.expression.text==='module' && ts.isIdentifier(b.left.name) && b.left.name.text === 'exports'){
            if(ts.isObjectLiteralExpression(b.right)){
              return b.right;
            }
          }
        }
        return undefined;
      }

      if(ts.isExportAssignment(s) && ts.isObjectLiteralExpression(s.expression)){
        return s.expression;
      }
      
    }).filter(potential => potential !==undefined) as ts.ObjectLiteralExpression[];
    
    if(potentials.length===1){
      moduleExportsEqualsObjectLiteralExpression = potentials[0];
    }
    return moduleExportsEqualsObjectLiteralExpression;
  }
  function getModuleExportsProperties(sourceFile:ts.SourceFile,isJs:boolean):ts.NodeArray<ts.ObjectLiteralElementLike>|undefined{
    const moduleExportsObjectLiteral = getModuleExportsEqualsObjectLiteralExpression(sourceFile,isJs);
    if(moduleExportsObjectLiteral===undefined){
      return undefined;
    }
    return moduleExportsObjectLiteral.properties
  }
  function extractComponentAndProps(sourceFile:ts.SourceFile,isJs:boolean,typeChecker?:ts.TypeChecker){
    const properties = getModuleExportsProperties(sourceFile,isJs);
    let component:string|undefined
    let props:any|undefined; //perhaps just return the property value for now and then will decide if {props:props,options...}
    if(properties){
      for(let i=0;i<properties.length;i++){
        const property = properties[i];
        let componentJustFound = false;
        if(component===undefined){
          component = extractComponent(property,typeChecker);
          if(component){
            componentJustFound = true;
          }
        }
        
        if(!componentJustFound && props===undefined){
          props = extractProps(property);
        }
        if(!!component && !!props){
          break;
        }
      }
      
    }
    return {
      component,
      props
    }
  }
  function extractComponent(property:ts.ObjectLiteralElementLike,typeChecker:ts.TypeChecker|undefined):string|undefined{
    //export type ObjectLiteralElementLike = PropertyAssignment | ShorthandPropertyAssignment | SpreadAssignment | MethodDeclaration | AccessorDeclaration;
    let componentAsString:string|undefined;
    if(ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'component'){
        const componentInitializer = property.initializer;

        let initializerKind = componentInitializer.kind;
        if(initializerKind === ts.SyntaxKind.ClassExpression || initializerKind === ts.SyntaxKind.FunctionExpression || initializerKind === ts.SyntaxKind.ArrowFunction){
          componentAsString = componentInitializer.getText();
        }else if(initializerKind === ts.SyntaxKind.Identifier && typeChecker){
          const variableSymbol = typeChecker.getSymbolAtLocation(componentInitializer);
          if(variableSymbol){
            const declaration = variableSymbol.declarations[0];
            if(ts.isVariableDeclaration(declaration)){
              //refactor
              const declarationInitializer = declaration.initializer;
              if(declarationInitializer){
                initializerKind = declarationInitializer.kind;
                if(initializerKind === ts.SyntaxKind.ClassExpression || initializerKind === ts.SyntaxKind.FunctionExpression || initializerKind === ts.SyntaxKind.ArrowFunction){
                  componentAsString = declarationInitializer.getText();
                }
              }
            }
          }
        }
    }else if(ts.isMethodDeclaration(property)){
      // just for now
      componentAsString = property.getText();
    }else if(ts.isShorthandPropertyAssignment(property)){
      // todo later
    }else if(ts.isSpreadAssignment(property)){
      // todo later
    }else if(ts.isGetAccessorDeclaration(property)){
      // todo later
    }
    return componentAsString;
  }
  function extractProps(property:ts.ObjectLiteralElementLike):ts.Expression|undefined{
    if(ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'props'){
      return property.initializer;
    }
    return undefined;
  }
  function extractPropsActual(props:ts.Expression,propsProperty?:string,typeChecker?:ts.TypeChecker){
    function getProps(propsOrObjectWithProps:ts.Expression){
      if(propsProperty===undefined){
        //how do you distinguish between props being props and props having props property ?
        //if one or the other then fine

        //if can be either then props property could mean a prop called props
        //or a property props that is props
        //if made props property _props ....

        if(ts.isObjectLiteralExpression(propsOrObjectWithProps)){
          return propsOrObjectWithProps.getText();
        }
      }else if(ts.isObjectLiteralExpression(propsOrObjectWithProps)){
        for(let i=0;i<propsOrObjectWithProps.properties.length;i++){
          const property = propsOrObjectWithProps.properties[i];
          if(ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === propsProperty){
            if(ts.isObjectLiteralExpression(property.initializer)){
              return property.initializer.getText();
            }
          }
        }
      }
    }
    if(ts.isArrayLiteralExpression(props)){
      return props.elements.map(element => getProps(element));
    }
    return getProps(props);
  }

  interface TypescriptParserTest{
    preCode?:string,
    isJs:boolean,
    description:string,
    component:string,
    expectedComponentText:string,
    props:string,
    propsExpectation?:(props:ts.Expression,typeChecker?:ts.TypeChecker)=>void
  }
  const componentFunctionPropertyTest:TypescriptParserTest=(()=> {
    const functionComponent = '' +
`function (){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Component function property',
      component:`component: ${functionComponent}`,
      expectedComponentText:functionComponent,
      props:'[]',
      propsExpectation(props){
        expect(ts.isArrayLiteralExpression(props)).toBe(true);
      }
    }
    return test;
  })();

  const typescriptTest:TypescriptParserTest=(()=> {
    const functionComponent = '' +
`function ():any{
  // for js - React.createElement
  // for tsx - <div/>
  return '';
}`

    const test:TypescriptParserTest={
      isJs:false,
      description:'Typescript test',
      component:`component: ${functionComponent}`,
      expectedComponentText:functionComponent,
      props:'[]',
    }
    return test;
  })();

  const worksWithAdditionalStatementsTest:TypescriptParserTest=(()=> {
    const functionComponent = '' +
`function (){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Works with additional statements',
      component:`component: ${functionComponent}`,
      expectedComponentText:functionComponent,
      props:'[]',
      preCode:'const path = require("path");'
    }
    return test;
  })();

  const componentArrowFunctionPropertyTest:TypescriptParserTest=(()=> {
    const arrowFunctionComponent = '' +
`() => {
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Component arrow function property',
      component:`component: ${arrowFunctionComponent}`,
      expectedComponentText:arrowFunctionComponent,
      props:'[]',
    }
    return test;
  })();

  const componentClassPropertyTest:TypescriptParserTest=(()=> {
    const classComponent = '' +
`class Component {
  render(){
    return null;
  }
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Component class function property',
      component:`component: ${classComponent}`,
      expectedComponentText:classComponent,
      props:'[]',
    }
    return test;
  })();
  
  const componentMethodTest:TypescriptParserTest=(()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Component method',
      component:`${methodComponent}`,
      expectedComponentText:methodComponent,
      props:'[]',
    }
    return test;
  })();

  const singlePropsStringTest:TypescriptParserTest=(()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Single Props',
      component:`${methodComponent}`,
      expectedComponentText:methodComponent,
      props:'{prop1:true}',
      propsExpectation(props:ts.Expression){
        const extractedProps = extractPropsActual(props);
        expect(extractedProps).toBe('{prop1:true}');
      }
    }
    return test;
  })();

  const arrayPropsStringTest:TypescriptParserTest=(()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Array Props',
      component:`${methodComponent}`,
      expectedComponentText:methodComponent,
      props:'[{prop1:true},{prop2:false}]',
      propsExpectation(props:ts.Expression){
        const extractedProps = extractPropsActual(props);
        expect(extractedProps).toEqual(['{prop1:true}','{prop2:false}']);
      }
    }
    return test;
  })();

  const arrayPropsOptionsStringTest:TypescriptParserTest=(()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Array Props Options',
      component:`${methodComponent}`,
      expectedComponentText:methodComponent,
      props:'[{option:true,props:{prop1:true}},{option:false,props:{prop2:false}}]',
      propsExpectation(props:ts.Expression){
        const extractedProps = extractPropsActual(props,'props');
        expect(extractedProps).toEqual(['{prop1:true}','{prop2:false}']);
      }
    }
    return test;
  })();
  
  // b) Might allow code and props to reference variables
  const tests:TypescriptParserTest[] = [
    componentFunctionPropertyTest,
    componentArrowFunctionPropertyTest,
    componentClassPropertyTest,
    componentMethodTest,
    singlePropsStringTest,
    arrayPropsStringTest,
    arrayPropsOptionsStringTest,
    worksWithAdditionalStatementsTest, 
    typescriptTest
  ];

  /* tests.forEach(test=> {
    it(test.description, () => {
      const exports = test.isJs?'module.exports':'export';
        const file = `
${test.preCode?test.preCode:''}
${exports} = {
  ${test.component},
  props:${test.props}
}
`
        const sourceFile = ts.createSourceFile(`index.${test.isJs?'js':'ts'}`,file,ts.ScriptTarget.Latest,true);
        const {component,props} = extractComponentAndProps(sourceFile,test.isJs);
        
        if(test.propsExpectation){
          test.propsExpectation(props);
        }

        expect(component).toBe(test.expectedComponentText);

    })
  })
 */
  // next create a program test with code string that uses variable for component - will need to expand 
  // search to allow for shorthand !
  
  const componentTypeCheckerTest:TypescriptParserTest=(()=> {
    const functionComponent = '' +
`function (){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Component function property',
      component:`component: componentVariable`,
      expectedComponentText:functionComponent,
      props:'[]',
      preCode:`const componentVariable = ${functionComponent}`
    }
    return test;
  })();
  const shorthandAssignmentTypeCheckerTest:TypescriptParserTest=(()=> {
    const functionComponent = '' +
`function (){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Component function property',
      component:`component`,
      expectedComponentText:functionComponent,
      props:'[]',
      preCode:`const componentVariable = ${functionComponent}`
    }
    return test;
  })();
  const programTests:TypescriptParserTest[] = [
    /* componentFunctionPropertyTest,
    componentArrowFunctionPropertyTest,
    componentClassPropertyTest,
    componentMethodTest,
    singlePropsStringTest,
    arrayPropsStringTest,
    arrayPropsOptionsStringTest, */
    //worksWithAdditionalStatementsTest, this will not work here
    //typescriptTest,
    //componentTypeCheckerTest,
    shorthandAssignmentTypeCheckerTest
  ];
  programTests.forEach(test=> {
    it(test.description + ' PROGRAM', () => {
      const exports = test.isJs?'module.exports':'export';
        const file = `
${test.preCode?test.preCode:''}
${exports} = {
  ${test.component},
  props:${test.props}
}
`
      //if working with real source file.....
      function createProgramFromString(contents:string,isJs:boolean){
        var compilerHost:ts.CompilerHost = {
          getSourceFile: function (filename, languageVersion) {
              if (filename === "index.ts"||filename === "index.js"){
                  return ts.createSourceFile(filename, contents, languageVersion, true);
              }
              /* if (filename === "lib.d.ts"){ // there are others as well
                  var libSource = fs.readFileSync(path.join(path.dirname(require.resolve('typescript')), 'lib.d.ts')).toString();
                  return ts.createSourceFile(filename, libSource, languageVersion, true);
              } */
              return undefined;
          },
          writeFile: function (name, text, writeByteOrderMark) {
              
          },
          useCaseSensitiveFileNames: function () { return false; },
          getCanonicalFileName: function (filename) { return filename; },
          //what is this for ?
          getCurrentDirectory: function () { return ""; },
          getNewLine: function () { return "\n"; },
          getDefaultLibFileName:function () { return "lib.d.ts"; },
          fileExists:null as any, //necessary if doing require
          readFile:null as any
        };
        // Create a program from inputs
        return ts.createProgram([`index.${isJs?'js':'ts'}`], {allowJs:true}, compilerHost);
      }
      
      const program = createProgramFromString(file,test.isJs);
      const sourceFile = program.getSourceFile(`index.${test.isJs?'js':'ts'}`)
      const typeChecker = program.getTypeChecker();
      const {component,props} = extractComponentAndProps(sourceFile!,test.isJs,typeChecker);
      
      if(test.propsExpectation){
        test.propsExpectation(props,typeChecker);
      }

      expect(component).toBe(test.expectedComponentText);

    })
  })
})

