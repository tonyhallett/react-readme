import { GeneratedReadmeWriter } from '../src/GeneratedReadmeWriter'
describe('GeneratedReadMeWriter', () => {
  describe('write', () => {
    
    it('should write GeneratedReadme toString to cwd with name from ctor arg', async () => {
      const readmeFileName = 'readmeFileName'
      const writeFileString = jest.fn().mockResolvedValue(undefined);
      const generatedReadmeWriter = new GeneratedReadmeWriter({
        path:{
          join:(...paths:string[])=> paths.join('/'),
          relative(from:string,to:string){
            return `${from}:${to}`
          }
        },
        fs:{
          writeFileString
        },cwd:'CWD'
      } as any,readmeFileName);

      await generatedReadmeWriter.write({
        toString:() => 'Generated read me'
      } as any);
      expect(writeFileString).toHaveBeenCalledWith('CWD/readmeFileName','Generated read me');
    })

    describe('GeneratedReadMeWriter.create',() => {
      it('should write GeneratedReadme toString to cwd/README.md', async () => {
        const writeFileString = jest.fn().mockResolvedValue(undefined);
        const generatedReadmeWriter = GeneratedReadmeWriter.create({
          path:{
            join:(...paths:string[])=> paths.join('/'),
            relative(from:string,to:string){
              return `${from}:${to}`
            }
          },
          fs:{
            writeFileString
          },cwd:'CWD'
        } as any);

        await generatedReadmeWriter.write({
          toString:() => 'Generated read me'
        } as any);
        expect(writeFileString).toHaveBeenCalledWith('CWD/README.md','Generated read me');
        })
      });
  });
  describe('getRelativePath', () => {

    it('should be relative to cwd', () => {
      const readmeFileNameOrPath = 'readmeFileNameOrPath'
      const writeFileString = jest.fn().mockResolvedValue(undefined);
      const generatedReadmeWriter = new GeneratedReadmeWriter({
        path:{
          relative(from:string,to:string){
            return `${from}:${to}`
          },
          
        },
        cwd:'CWD'
      } as any,readmeFileNameOrPath);

      const relativeToReadme = generatedReadmeWriter.getRelativePath('to somewhere');
      expect(relativeToReadme).toBe('CWD:to somewhere');
    })
  })
})