import { newlineSpacer} from '../src/GeneratedReadme/newlineSpacer';

describe('newlineSpacer', () => {
  interface NewlineSpacerTest{
    description:string,
    numberOfNewlines:number,
    parts:Array<Array<string>>,
    expectedResult:string,
    
  }
  const tests:NewlineSpacerTest[] = [
    {
      description:'single with single entry',
      numberOfNewlines:1,
      parts:[['part']],
      expectedResult:'part'
    },
    {
      description:'single with multiple',
      numberOfNewlines:2,
      parts:[['1','2']],
      expectedResult:'1\n\n2'
    },
    {
      description:'multiple with multiple',
      numberOfNewlines:2,
      parts:[['1','2'],['3','4']],
      expectedResult:'1\n\n2\n\n3\n\n4'
    },
    {
      description:'multiple with empty',
      numberOfNewlines:2,
      parts:[['1'],[],['2','3','4']],
      expectedResult:'1\n\n2\n\n3\n\n4'
    },
  ];
  tests.forEach(test => {
    it(test.description, () => {
      expect(newlineSpacer(test.numberOfNewlines,test.parts)).toBe(test.expectedResult);
    })
  })
})