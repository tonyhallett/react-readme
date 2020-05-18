import { GeneratedReadme } from '../src/GeneratedReadme'
describe('GeneratedReadme result from toString', () => {
  beforeEach(()=>{
    jest.clearAllMocks();
  });

  it('should come from the newlineSpacer', () => {
    const newlineSpacer = jest.fn().mockReturnValue('spaced');
    const generatedReadme = new GeneratedReadme(jest.fn(),jest.fn(),newlineSpacer);
    expect(generatedReadme.toString()).toBe('spaced');
  })
  it('should have two new lines between parts', () => {
    const newlineSpacer = jest.fn().mockReturnValue('spaced');
    const generatedReadme = new GeneratedReadme(jest.fn(),jest.fn(),newlineSpacer);
    generatedReadme.toString();
    expect(newlineSpacer.mock.calls[0][0]).toBe(2);
  })
  describe('entries', () => {
    [1,2].forEach(numCalls => {
      it('should have an entry for each call to addComponentGeneration', () => {
        const newlineSpacer = jest.fn().mockReturnValue('spaced');
        const generatedReadme = new GeneratedReadme(jest.fn(),jest.fn(),newlineSpacer);
        for(let i=0;i<numCalls;i++){
          generatedReadme.addComponentGeneration({code:'',language:''},'',{altText:'',componentImagePath:''});
        }
        
        generatedReadme.toString();
        expect(newlineSpacer.mock.calls[0][1].length).toBe(numCalls);
      })
    })
    
    describe('entry', () => {
      describe('entries when present', () => {
        const newlineSpacer = jest.fn().mockReturnValue('spaced');
        const markdownImageCreator = jest.fn().mockReturnValue('markdown image');
        const markdownCodeCreator = jest.fn().mockReturnValue('markdown code');
        let componentReadmeParts:string[]
        beforeEach(()=> {
          jest.clearAllMocks();
          const generatedReadme = new GeneratedReadme(markdownCodeCreator,markdownImageCreator,newlineSpacer);
          generatedReadme.addComponentGeneration(
            {code:'some code',language:'some language'},
            'component readme',
            {altText:'alt text',componentImagePath:'image path'}
          );
          
          generatedReadme.toString();
          const componentsReadmeParts = newlineSpacer.mock.calls[0][1];
          expect(componentsReadmeParts[0].length).toBe(3);
          componentReadmeParts = componentsReadmeParts[0];
        })
        it('should have first entry the component readme if present', ()=> {
          expect(componentReadmeParts[0]).toBe('component readme');
        })
        it('should have as the second entry the result from markdownImageCreator', () => {
          expect(componentReadmeParts[1]).toBe('markdown image');
          expect(markdownImageCreator).toHaveBeenCalledWith('image path','alt text');
        })
        it('should have as third entry ( if code ) then result from the markdownCodeCreator', () => {
          expect(componentReadmeParts[2]).toBe('markdown code');
          expect(markdownCodeCreator).toHaveBeenCalledWith('some code','some language');
        })
      });
      
      [0,1,2].forEach(definedArgument => {
        it(`should just have single entry - Argument ${definedArgument}`, () => {
          const newlineSpacer = jest.fn().mockReturnValue('spaced');
          const markdownImageCreator = jest.fn().mockReturnValue('markdown image');
          const markdownCodeCreator = jest.fn().mockReturnValue('markdown code');
          
          
          const generatedReadme = new GeneratedReadme(markdownCodeCreator,markdownImageCreator,newlineSpacer);
          generatedReadme.addComponentGeneration(
            definedArgument===0?{code:'code',language:'language'}:undefined,
            definedArgument===1?'component readme':undefined,
            definedArgument===2?{altText:'alt text',componentImagePath:'image path'}:undefined
          );
          
          generatedReadme.toString();

          const componentsReadmeParts = newlineSpacer.mock.calls[0][1];
          expect(componentsReadmeParts[0].length).toBe(1);
          const entry = componentsReadmeParts[0][0];
          
          switch(definedArgument){
            case 0:
              expect(entry).toBe('markdown code');
              expect(markdownCodeCreator).toHaveBeenCalledWith('code','language');
              break;
            case 1:
              expect(entry).toBe('component readme')
              break;
            case 2:
              expect(entry).toBe('markdown image');
              expect(markdownImageCreator).toHaveBeenCalledWith('image path','alt text')
              break;
          }
          
        })
        
      })
      })
      

    it('should have surrounded entries from surround with', () => {
      const newlineSpacer = jest.fn().mockReturnValue('spaced');
      const markdownImageCreator = jest.fn().mockReturnValue('markdown image');
      
      jest.clearAllMocks();
      const generatedReadme = new GeneratedReadme(jest.fn(),markdownImageCreator,newlineSpacer);
      generatedReadme.addComponentGeneration(
        {code:'',language:''},
        '',
        {altText:'alt text',componentImagePath:'image path'}
      );
      generatedReadme.surroundWith('pre','post')
      generatedReadme.toString();
      const componentsReadmeParts = newlineSpacer.mock.calls[0][1];
      expect(componentsReadmeParts.length).toBe(3);
      expect(componentsReadmeParts[0].length).toBe(1);
      expect(componentsReadmeParts[0][0]).toBe('pre');
      expect(componentsReadmeParts[2].length).toBe(1);
      expect(componentsReadmeParts[2][0]).toBe('post');
    })


  })
})