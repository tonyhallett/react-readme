import * as ts from 'typescript';
import fs = require("fs");
import path = require("path");

describe('parsing typescript ( tsx )', () => {
  function isPropertyAssignmentWithName(property:ts.ObjectLiteralElementLike, name:string):property is ts.PropertyAssignment{
    return ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === name;
  }
  function isShorthandPropertyAssignmentWithName(property:ts.ObjectLiteralElementLike,name:string):property is ts.ShorthandPropertyAssignment{
    return ts.isShorthandPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === name;
  }
  function isComponentType(kind:ts.SyntaxKind){
    return kind=== ts.SyntaxKind.ClassExpression || kind === ts.SyntaxKind.FunctionExpression || kind === ts.SyntaxKind.ArrowFunction;
  }
  function getObjectLiteralFromExpressionOrReference(expression:ts.Expression,typeChecker?:ts.TypeChecker){
    if(ts.isObjectLiteralExpression(expression)){
      return expression;
    }else if(ts.isIdentifier(expression)&&typeChecker){
      const variableSymbol = typeChecker.getSymbolAtLocation(expression);
      const declaration = getReferencedDeclaration(variableSymbol);
      if(declaration && ts.isObjectLiteralExpression(declaration)){
        return declaration;
      }
    }
  }
  function getModuleExportsEqualsObjectLiteralExpression(sourceFile:ts.SourceFile,isJs:boolean,typeChecker?:ts.TypeChecker):ts.ObjectLiteralExpression|undefined{
    
    let moduleExportsEqualsObjectLiteralExpression:ts.ObjectLiteralExpression|undefined;
    const potentials = sourceFile!.statements.map(s=>{
      if(isJs){
        if(ts.isExpressionStatement(s) && ts.isBinaryExpression(s.expression)){
          const b= s.expression;
          if(ts.isPropertyAccessExpression(b.left)&&ts.isIdentifier(b.left.expression) && b.left.expression.text==='module' && ts.isIdentifier(b.left.name) && b.left.name.text === 'exports'){
            return getObjectLiteralFromExpressionOrReference(b.right,typeChecker);
          }
        }
        return undefined;
      }
      if(ts.isExportAssignment(s)){
        return getObjectLiteralFromExpressionOrReference(s.expression,typeChecker);
      }
      
    }).filter(potential => potential !==undefined) as ts.ObjectLiteralExpression[];
    
    if(potentials.length===1){
      moduleExportsEqualsObjectLiteralExpression = potentials[0];
    }
    return moduleExportsEqualsObjectLiteralExpression;
  }
  function getModuleExportsProperties(sourceFile:ts.SourceFile,isJs:boolean,typeChecker?:ts.TypeChecker):ts.NodeArray<ts.ObjectLiteralElementLike>|undefined{
    const moduleExportsObjectLiteral = getModuleExportsEqualsObjectLiteralExpression(sourceFile,isJs,typeChecker);
    if(moduleExportsObjectLiteral===undefined){
      return undefined;
    }
    return moduleExportsObjectLiteral.properties
  }
  function extractComponentAndProps(sourceFile:ts.SourceFile,isJs:boolean,typeChecker?:ts.TypeChecker){
    const properties = getModuleExportsProperties(sourceFile,isJs,typeChecker);
    let component:string|undefined
    let props:any|undefined;
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
          props = extractProps(property, typeChecker);
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
  function getReferencedDeclaration(symbol:ts.Symbol|undefined){
    if(symbol){
      const declaration = symbol.declarations[0];
      if(ts.isVariableDeclaration(declaration)){
        return declaration.initializer;
      }
    }
  }
  function getReferencedComponent(symbol:ts.Symbol|undefined){
    const declarationInitializer = getReferencedDeclaration(symbol);
    if(declarationInitializer){
      if(isComponentType(declarationInitializer.kind)){
        return declarationInitializer.getText();
      }
    }
  }
  function extractComponent(property:ts.ObjectLiteralElementLike,typeChecker:ts.TypeChecker|undefined):string|undefined{
    //export type ObjectLiteralElementLike = PropertyAssignment | ShorthandPropertyAssignment | SpreadAssignment | MethodDeclaration | AccessorDeclaration;
    let componentAsString:string|undefined;
    if(isPropertyAssignmentWithName(property,'component')){
        const componentInitializer = property.initializer;

        let initializerKind = componentInitializer.kind;
        if(isComponentType(initializerKind)){
          componentAsString = componentInitializer.getText();
        }else if(initializerKind === ts.SyntaxKind.Identifier && typeChecker){
          const variableSymbol = typeChecker.getSymbolAtLocation(componentInitializer);
          componentAsString = getReferencedComponent(variableSymbol);
        }
    }else if(ts.isMethodDeclaration(property)){
      // just for now
      componentAsString = property.getText();
    }else if(isShorthandPropertyAssignmentWithName(property,'component') && typeChecker){
      const symbol = typeChecker.getShorthandAssignmentValueSymbol(property);
      componentAsString = getReferencedComponent(symbol);
    }else if(ts.isSpreadAssignment(property)){
      // todo later
    }else if(ts.isGetAccessorDeclaration(property)){
      // no need for this
    }
    return componentAsString;
  }
  function extractProps(property:ts.ObjectLiteralElementLike,typeChecker?:ts.TypeChecker):ts.Expression|undefined{
    if(isPropertyAssignmentWithName(property,'props')){
      const initializer = property.initializer;
      if(initializer.kind === ts.SyntaxKind.Identifier && typeChecker){
        const variableSymbol = typeChecker.getSymbolAtLocation(initializer);
        return getReferencedDeclaration(variableSymbol);
      }
      return property.initializer;
    }
    if(isShorthandPropertyAssignmentWithName(property,'props') && typeChecker){
      const symbol = typeChecker.getShorthandAssignmentValueSymbol(property);
      return getReferencedDeclaration(symbol);
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
        const objectLiteralExpression = getObjectLiteralFromExpressionOrReference(propsOrObjectWithProps,typeChecker);
        if(objectLiteralExpression){
          return objectLiteralExpression.getText();
        }
      }else{
        
        if(ts.isObjectLiteralExpression(propsOrObjectWithProps)){
          for(let i=0;i<propsOrObjectWithProps.properties.length;i++){
            const property = propsOrObjectWithProps.properties[i];
  
            //this will need to be property assignment or shorthand
            if(ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === propsProperty){
              if(ts.isObjectLiteralExpression(property.initializer)){
                return property.initializer.getText();
              }
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
  interface TypescriptParserTest{
    isJs:boolean,
    description:string,
    expectedComponentText:string,
    file:string,
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
      expectedComponentText:functionComponent,
      file:getExportsEqualsObjectLiteralFile(true,`component: ${functionComponent}`,'props:[]'),
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
      expectedComponentText:functionComponent,
      file:getExportsEqualsObjectLiteralFile(false,`component: ${functionComponent}`,'props:[]'),
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
      expectedComponentText:functionComponent,
      file:getExportsEqualsObjectLiteralFile(true,`component: ${functionComponent}`,'props:[]','const path = require("path");'),
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
      expectedComponentText:arrowFunctionComponent,
      file:getExportsEqualsObjectLiteralFile(true,`component: ${arrowFunctionComponent}`,'props:[]'),
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
      expectedComponentText:classComponent,
      file:getExportsEqualsObjectLiteralFile(true,`component: ${classComponent}`,'props:[]'),
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
      expectedComponentText:methodComponent,
      file:getExportsEqualsObjectLiteralFile(true,`${methodComponent}`,'props:[]'),
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
      expectedComponentText:methodComponent,
      propsExpectation(props:ts.Expression){
        const extractedProps = extractPropsActual(props);
        expect(extractedProps).toBe('{prop1:true}');
      },
      file:getExportsEqualsObjectLiteralFile(true,`${methodComponent}`,'props:{prop1:true}'),
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
      expectedComponentText:methodComponent,
      propsExpectation(props:ts.Expression){
        const extractedProps = extractPropsActual(props);
        expect(extractedProps).toEqual(['{prop1:true}','{prop2:false}']);
      },
      file:getExportsEqualsObjectLiteralFile(true,`${methodComponent}`,'props:[{prop1:true},{prop2:false}]'),
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
      expectedComponentText:methodComponent,
      propsExpectation(props:ts.Expression){
        const extractedProps = extractPropsActual(props,'props');
        expect(extractedProps).toEqual(['{prop1:true}','{prop2:false}']);
      },
      file:getExportsEqualsObjectLiteralFile(true,`${methodComponent}`,'props:[{option:true,props:{prop1:true}},{option:false,props:{prop2:false}}]'),
    }
    return test;
  })();
  
  
  const tests:TypescriptParserTest[] = [
    /* componentFunctionPropertyTest,
    componentArrowFunctionPropertyTest,
    componentClassPropertyTest,
    componentMethodTest,
    singlePropsStringTest,
    arrayPropsStringTest,
    arrayPropsOptionsStringTest,
    worksWithAdditionalStatementsTest, 
    typescriptTest */
  ];
  
  tests.forEach(test=> {
    it(test.description, () => {
        const sourceFile = ts.createSourceFile(`index.${test.isJs?'js':'ts'}`,test.file,ts.ScriptTarget.Latest,true);
        const {component,props} = extractComponentAndProps(sourceFile,test.isJs);
        
        if(test.propsExpectation){
          test.propsExpectation(props);
        }

        expect(component).toBe(test.expectedComponentText);
    })
  })

  const componentTypeCheckerTest:TypescriptParserTest=(()=> {
    const functionComponent = '' +
`function (){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Component function property',
      expectedComponentText:functionComponent,
      file:getExportsEqualsObjectLiteralFile(true,'component: componentVariable','props:[]',`const componentVariable = ${functionComponent}`),
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
      expectedComponentText:functionComponent,
      file:getExportsEqualsObjectLiteralFile(true,'component','props:[]',`const component = ${functionComponent}`),
    }
    return test;
  })();
  const referencedPropsTest:TypescriptParserTest=(()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Single Props',
      expectedComponentText:methodComponent,
      propsExpectation(props:ts.Expression){
        const extractedProps = extractPropsActual(props);
        expect(extractedProps).toBe('{prop1:true}');
      },
      file:getExportsEqualsObjectLiteralFile(true,`${methodComponent}`,'props:propsVariable',`const propsVariable = {prop1:true}`),
    }
    return test;
  })();
  const referencedPropsEntriesTest:TypescriptParserTest=(()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'Single Props',
      expectedComponentText:methodComponent,
      propsExpectation(props,typeChecker){
        const extractedProps = extractPropsActual(props,undefined,typeChecker);
        expect(extractedProps).toEqual(['{prop1:true}','{prop2:false}']);
      },
      file:getExportsEqualsObjectLiteralFile(true,`${methodComponent}`,'props:propsVariable',`
      const props1 = {prop1:true};
      const props2 = {prop2:false};
      const propsVariable = [props1,props2];
      `),
    }
    return test;
  })();

  const referencedOptionsPropsEntriesTest:TypescriptParserTest=(()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`
    const props = `{prop:'prop'}`;
    const props3 = `{prop:'3'}`;
    const props4 = `{prop:'4'}`;
    const test:TypescriptParserTest={
      isJs:true,
      description:'Single Props',
      expectedComponentText:methodComponent,
      propsExpectation(props,typeChecker){
        const extractedProps = extractPropsActual(props,undefined,typeChecker);
        expect(extractedProps).toEqual([props,props,props3,props4]);
      },
      file:getExportsEqualsObjectLiteralFile(true,`${methodComponent}`,'props:propsVariable',`
      const props = ${props};
      const props3 = ${props3};
      const props4 = ${props4};
      const options2 = {option1:'2',props}
      const options4 = {option1:'4',props4}
      //could add normal options here as well
      const propsVariable = [{option1:'1',props},options2,{option1:'3',props:props3},options4];
      `),
    }
    return test;
  })();

  const exportsEqualsVariableTest:TypescriptParserTest = (()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:true,
      description:'module.exports = someVar',
      expectedComponentText:methodComponent,
      file:getExportsEqualVariable(true,`${methodComponent}`,'props:[]'),
    }
    return test;
  })();
  const exportsEqualsVariableTestTypescript:TypescriptParserTest = (()=> {
    const methodComponent = '' +
`component(){
  // for js - React.createElement
  // for tsx - <div/>
}`

    const test:TypescriptParserTest={
      isJs:false,
      description:'module.exports = someVar typescript',
      expectedComponentText:methodComponent,
      file:getExportsEqualVariable(false,`${methodComponent}`,'props:[]'),
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
    arrayPropsOptionsStringTest,
    //worksWithAdditionalStatementsTest, this will not work here
    typescriptTest,
    componentTypeCheckerTest,
    shorthandAssignmentTypeCheckerTest,
    referencedPropsTest,
    exportsEqualsVariableTest,
    exportsEqualsVariableTestTypescript, */
    //referencedPropsEntriesTest,
    referencedOptionsPropsEntriesTest
  ];
  programTests.forEach(test=> {
    it(test.description + ' PROGRAM', () => {
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
      
      const program = createProgramFromString(test.file,test.isJs);
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

