import { GeneratedReadmeWriter } from '../src/GeneratedReadmeWriter'
describe('GeneratedReadMeWriter', () => {
  describe('write', () => {
    
    it('should write GeneratedReadme toString to absoluteOrCwdJoin the ctor argument', async () => {
      const readmeFileNameOrPath = 'readmeFileNameOrPath'
      const writeFileString = jest.fn().mockResolvedValue(undefined);
      const generatedReadmeWriter = new GeneratedReadmeWriter({
        path:{
          absoluteOrCwdJoin(path:string){
            return `absoluteOrCwdJoin/${path}`;
          },
          relative(from:string,to:string){
            return `${from}:${to}`
          }
        },
        fs:{
          writeFileString
        }
      } as any,readmeFileNameOrPath);

      await generatedReadmeWriter.write({
        toString:() => 'Generated read me'
      } as any);
      expect(writeFileString).toHaveBeenCalledWith('absoluteOrCwdJoin/readmeFileNameOrPath','Generated read me');
    })
  });
  describe('getRelativePath', () => {

    it('should be relative to where it writes the readme', () => {
      const readmeFileNameOrPath = 'readmeFileNameOrPath'
      const writeFileString = jest.fn().mockResolvedValue(undefined);
      const generatedReadmeWriter = new GeneratedReadmeWriter({
        path:{
          absoluteOrCwdJoin(path:string){
            return `absoluteOrCwdJoin/${path}`;
          },
          relative(from:string,to:string){
            return `${from}:${to}`
          }
        },
        fs:{
          writeFileString
        }
      } as any,readmeFileNameOrPath);

      const relativeToReadme = generatedReadmeWriter.getRelativePath('to somewhere');
      expect(relativeToReadme).toBe('absoluteOrCwdJoin/readmeFileNameOrPath:to somewhere');
    })
  })
})