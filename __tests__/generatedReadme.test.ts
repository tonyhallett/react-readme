import { GeneratedReadme } from '../src/GeneratedReadme'
describe('GeneratedReadme result from toString', () => {
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
      })
      it('should just have result fom markdownImageCreator if no component readme and no code', () => {
        const newlineSpacer = jest.fn().mockReturnValue('spaced');
        const markdownImageCreator = jest.fn().mockReturnValue('markdown image');
        
        jest.clearAllMocks();
        const generatedReadme = new GeneratedReadme(jest.fn(),markdownImageCreator,newlineSpacer);
        generatedReadme.addComponentGeneration(
          {code:'',language:''},
          '',
          {altText:'alt text',componentImagePath:'image path'}
        );
        
        generatedReadme.toString();
        const componentsReadmeParts = newlineSpacer.mock.calls[0][1];
        expect(componentsReadmeParts[0].length).toBe(1);
        expect(componentsReadmeParts[0][0]).toBe('markdown image');
      })
      
    })
  })
})