import {PuppeteerImageGeneratorWriter} from '../src/PuppeteerImageGeneratorWriter'
import { ComponentScreenshot } from '../src/PuppeteerImageGenerator';

describe('PuppeteerImageGeneratorWriter generateAndWrite', () => {
  it('should call the generator with the arguments', async () => {
    const mockGenerator = jest.fn().mockResolvedValue([]);
    const puppeteerImageGeneratorWriter = new PuppeteerImageGeneratorWriter(mockGenerator, null as any);
    const componentScreenshots:Array<ComponentScreenshot> = [];
    const puppeteerLaunchOptions = {};
    await puppeteerImageGeneratorWriter.generateAndWrite(componentScreenshots,puppeteerLaunchOptions);
    const args = mockGenerator.mock.calls[0];
    expect(args[0]).toBe(componentScreenshots);
    expect(args[1]).toBe(puppeteerLaunchOptions);
  })
  it('should write to the id path the image buffer for each generator result', async () => {
    const mockResults = [
      {
        image:'image1',
        id:'1'
      },
      {
        image:'image2',
        id:'2'
      }
    ]
    const mockGenerator = jest.fn().mockResolvedValue(mockResults);
    const writeFileBuffer=jest.fn().mockResolvedValue('');
    const puppeteerImageGeneratorWriter = new PuppeteerImageGeneratorWriter(mockGenerator,{
      fs:{
        writeFileBuffer
      }
    } as any);
    const componentScreenshots:Array<ComponentScreenshot> = [];
    const puppeteerLaunchOptions = {};
    await puppeteerImageGeneratorWriter.generateAndWrite(componentScreenshots,puppeteerLaunchOptions);
    expect(writeFileBuffer).toHaveBeenCalledWith('1','image1');
    expect(writeFileBuffer).toHaveBeenCalledWith('2','image2');
  })
})