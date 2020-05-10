import * as path from 'path'
describe('', () => {
  it('', () => {
    const readMeWritePath = path.join(__dirname, 'other','readme.md');
    //will then need to determine which is from and which is to
    const imagePath = path.join(__dirname,'readme-assets','images','componentimage.png');
    console.log(path.relative(readMeWritePath,imagePath));
    console.log(path.relative(imagePath,readMeWritePath));
  })
})