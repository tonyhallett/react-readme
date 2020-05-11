import {determineWidthHeight} from '../../src/PuppeteerImageGenerator/determineWidthHeight'
describe('determineWidthAndHeight', () => {
  beforeEach(()=>{
    jest.clearAllMocks();
  })
  
 const dollar = jest.fn().mockResolvedValue({
  boxModel(){
    return {
      width:100,
      height:200
    }
  }
})
 function determine(width:number|undefined,height:number|undefined){
  return determineWidthHeight({
    $:dollar
  } as any, width,height);
 }
 it('should return options width and options height if defined and not 0', async () => {
  const result = await determine(5,10);
  expect(result).toEqual({width:5, height:10});
 })
 it('should throw for negative option width', () => {
  return expect(determine(-5,10)).rejects.toThrowError();
 })
 it('should throw for negative option height', () => {
  return expect(determine(10,-5)).rejects.toThrowError();
})
 describe('defaulting width /height', () => {
  it('should return width from body box model for width if width is undefined or 0',async () => {
    const expected = {width:100, height:10};
    let result = await determine(0,10);
    expect(dollar).toHaveBeenCalledWith('body');
    expect(result).toEqual(expected);
    result = await determine(undefined,10);
    expect(result).toEqual(expected);
  })
  it('should return height from body box model for heigtht if height is undefined or 0', async () => {
    const expected = {width:10, height:200};
    let result = await determine(10,0);
    expect(dollar).toHaveBeenCalledWith('body');
    expect(result).toEqual(expected);
    result = await determine(10,undefined);
    expect(result).toEqual(expected);
  })
 })
 
})