import { ReactReadmeRequirer } from '../src/ReactReadmeRequirer';

describe('ReactReadme', () => {
  describe('exists', () => {
    [true,false].forEach((readmeExists)=> {
      it(`should look the folder for react-readme.js - ${readmeExists}`,async () => {
        const exists = jest.fn().mockResolvedValue(readmeExists);
        const reactReadme = new ReactReadmeRequirer({
          path:{
            join(...paths:string[]){
              return paths.join('/');
            },
            exists
          }
        } as any,null as any)
        expect(await reactReadme.exists('someFolder')).toBe(readmeExists);
        expect(exists).toHaveBeenCalledWith('someFolder/react-readme.js');
      })
    })
    
  })

  describe('read', () => {
    it('should require the react-readme.js in the provided folder', async () => {
      const readme = {

      }
      const require = jest.fn().mockReturnValue(readme);
      const reactReadme = new ReactReadmeRequirer({
        path:{
          join(...paths:string[]){
            return paths.join('/');
          },
        }
      } as any,{
        require
      } as any);
      const read = await reactReadme.read('someFolder');
      expect(read).toBe(readme);
      expect(require).toHaveBeenCalledWith('someFolder/react-readme.js');
    })
  })
})