import * as ts from 'typescript';
import { IOptionsParser } from "./RequiringComponentFolderOptionsProvider";
import { ISystem } from "../interfaces";
import * as fs from 'fs-extra';
import * as path from 'path';

const typescriptDirectory = path.dirname(require.resolve('typescript'));

function isPropertyAssignmentWithName(property:ts.ObjectLiteralElementLike, name:string):property is ts.PropertyAssignment{
  return ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === name;
}
function isShorthandPropertyAssignmentWithName(property:ts.ObjectLiteralElementLike,name:string):property is ts.ShorthandPropertyAssignment{
  return ts.isShorthandPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === name;
}


function isComponentType(kind:ts.SyntaxKind){
  return kind=== ts.SyntaxKind.ClassExpression || kind === ts.SyntaxKind.FunctionExpression || kind === ts.SyntaxKind.ArrowFunction;
}

function getObjectLiteralFromExpressionOrReference(expression:ts.Expression,typeChecker:ts.TypeChecker){
  if(ts.isObjectLiteralExpression(expression)){
    return expression;
  }else if(ts.isIdentifier(expression)){
    const variableSymbol = typeChecker.getSymbolAtLocation(expression);
    const declaration = getReferencedDeclaration(variableSymbol);
    if(declaration && ts.isObjectLiteralExpression(declaration)){
      return declaration;
    }
  }
}
function getModuleExportsEqualsObjectLiteralExpression(sourceFile:ts.SourceFile,isJs:boolean,typeChecker:ts.TypeChecker):ts.ObjectLiteralExpression|undefined{
  
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
function getModuleExportsProperties(sourceFile:ts.SourceFile,isJs:boolean,typeChecker:ts.TypeChecker):ts.NodeArray<ts.ObjectLiteralElementLike>|undefined{
  const moduleExportsObjectLiteral = getModuleExportsEqualsObjectLiteralExpression(sourceFile,isJs,typeChecker);
  if(moduleExportsObjectLiteral===undefined){
    return undefined;
  }
  return moduleExportsObjectLiteral.properties
}
function extractComponentAndProps(sourceFile:ts.SourceFile,isJs:boolean,typeChecker:ts.TypeChecker){
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
function extractComponent(property:ts.ObjectLiteralElementLike,typeChecker:ts.TypeChecker):string|undefined{
  //export type ObjectLiteralElementLike = PropertyAssignment | ShorthandPropertyAssignment | SpreadAssignment | MethodDeclaration | AccessorDeclaration;
  let componentAsString:string|undefined;
  if(isPropertyAssignmentWithName(property,'component')){
      const componentInitializer = property.initializer;

      let initializerKind = componentInitializer.kind;
      if(isComponentType(initializerKind)){
        componentAsString = componentInitializer.getText();
      }else if(initializerKind === ts.SyntaxKind.Identifier){
        const variableSymbol = typeChecker.getSymbolAtLocation(componentInitializer);
        componentAsString = getReferencedComponent(variableSymbol);
      }
  }else if(ts.isMethodDeclaration(property)){
    // just for now
    componentAsString = property.getText();
  }else if(isShorthandPropertyAssignmentWithName(property,'component')){
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(property);
    componentAsString = getReferencedComponent(symbol);
  }else if(ts.isSpreadAssignment(property)){
    // todo later
  }else if(ts.isGetAccessorDeclaration(property)){
    // no need for this
  }
  return componentAsString;
}
function extractProps(property:ts.ObjectLiteralElementLike,typeChecker:ts.TypeChecker):ts.Expression|undefined{
  if(isPropertyAssignmentWithName(property,'props')){
    const initializer = property.initializer;
    if(initializer.kind === ts.SyntaxKind.Identifier){
      const variableSymbol = typeChecker.getSymbolAtLocation(initializer);
      return getReferencedDeclaration(variableSymbol);
    }
    return property.initializer;
  }
  if(isShorthandPropertyAssignmentWithName(property,'props')){
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(property);
    return getReferencedDeclaration(symbol);
  }
  return undefined;
}
function extractPropsActual(props:ts.Expression,propsProperty:string|undefined,typeChecker:ts.TypeChecker){
  function getProps(propsOrObjectWithProps:ts.Expression){
    const objectLiteralExpression = getObjectLiteralFromExpressionOrReference(propsOrObjectWithProps,typeChecker);
    if(objectLiteralExpression){
      if(propsProperty===undefined){
        return objectLiteralExpression.getText();
      }
      for(let i=0;i<objectLiteralExpression.properties.length;i++){
        const property = objectLiteralExpression.properties[i];

        if(isPropertyAssignmentWithName(property,propsProperty)){
          const objectLiteralExpression = getObjectLiteralFromExpressionOrReference(property.initializer,typeChecker);
          if(objectLiteralExpression){
            return objectLiteralExpression.getText();
          }
        }else if(isShorthandPropertyAssignmentWithName(property,propsProperty)){
          const symbol = typeChecker.getShorthandAssignmentValueSymbol(property);
          const referencedObjectLiteral =  getReferencedDeclaration(symbol);
          if(referencedObjectLiteral && ts.isObjectLiteralExpression(referencedObjectLiteral)){
            return referencedObjectLiteral.getText();
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


function createProgram(rootName:string){
  var compilerHost:ts.CompilerHost = {
    getSourceFile: function (filename, languageVersion) {
      const contents = fs.readFileSync(filename,'utf8');
      return ts.createSourceFile(filename, contents, languageVersion, true);
    },
    writeFile: function (name, text, writeByteOrderMark) { },
    useCaseSensitiveFileNames: function () { return false; },
    getCanonicalFileName: function (filename) { return filename; },
    getCurrentDirectory: function () { return ""; },
    getNewLine: function () { return "\n"; },
    getDefaultLibFileName:ts.getDefaultLibFilePath,
    fileExists:(fileName)=>{
      return fs.existsSync(fileName);
    },
    readFile:(fileName)=>{
      return fs.readFileSync(fileName,'utf8');
    }
  };
  
  return ts.createProgram([rootName], {allowJs:true}, compilerHost);
}

// for now will just do exports = 
export class TypescriptOptionsParser implements IOptionsParser{
  constructor(private readonly system:ISystem){ }
  getComponentCode(filePath: string): string|undefined {
    const isJs = this.system.path.extname(filePath) === '.js';
    const program = createProgram(filePath);
    const sourceFile = program.getSourceFile(filePath);
    const typeChecker = program.getTypeChecker();
    const {component} = extractComponentAndProps(sourceFile!,isJs,typeChecker);
    return component
  }

}