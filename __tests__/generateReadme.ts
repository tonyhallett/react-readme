import generate from '../src/generate'
import {generateReadme} from '../src/index'
import {createFolderRequiringAssetManager} from '../src/asset-management/FolderRequiringAssetManager'
import {createGeneratedReadmeWriter} from '../src/GeneratedReadmeWriter'
import { PuppeteerImageGeneratorWriter } from '../src/PuppeteerImageGeneratorWriter'
import { GeneratedReadme } from '../src/GeneratedReadme'
import { requirer} from '../src/Requirer'
import { System } from '../src/System'
import {generateMultipleWithPuppeteer} from '../src/PuppeteerImageGenerator/index'
import { markdownCodeCreator, createMarkdownImageCreator } from '../src/GeneratedReadme/readMePartCreators'
import { newlineSpacer } from '../src/GeneratedReadme/newlineSpacer'
import { encoder } from '../src/GeneratedReadme/Encoder'
import { SuffixComponentSorter } from '../src/SuffixComponentSorter'
jest.mock('../src/asset-management/FolderRequiringAssetManager')
jest.mock('../src/generate');
jest.mock('../src/asset-management/FolderRequiringAssetManager');
jest.mock('../src/GeneratedReadmeWriter')
jest.mock('../src/PuppeteerImageGeneratorWriter');
jest.mock('../src/GeneratedReadme');
jest.mock('../src/Requirer')
jest.mock('../src/GeneratedReadme/readMePartCreators');

const mockGenerate = generate as jest.Mock;
const mockCreateFolderRequiringAssetManager = createFolderRequiringAssetManager as jest.Mock;
const mockCreateGeneratedReadmeWriter = createGeneratedReadmeWriter as jest.Mock;
const mockPuppeteerImageGeneratorWriter = PuppeteerImageGeneratorWriter as jest.Mock;
const mockGeneratedReadme = GeneratedReadme as jest.Mock;
const mockCreateMarkdownImageCreator = createMarkdownImageCreator as jest.Mock;
describe('generateReadme', () => {
  beforeEach(()=>{
    jest.clearAllMocks();
    return executeGenerate();
  })
  function getGenerateArgument(index:number){
    return mockGenerate.mock.calls[0][index];
  }
  const folderRequiringAssetManager = {};
  const generatedReadmeWriter ={};
  const markdownImageCreator = {};
  async function executeGenerate(){
    createMarkdownImageCreator
    mockCreateFolderRequiringAssetManager.mockResolvedValue(folderRequiringAssetManager);
    mockCreateGeneratedReadmeWriter.mockReturnValue(generatedReadmeWriter);
    mockCreateMarkdownImageCreator.mockReturnValue(markdownImageCreator);
    await generateReadme();
  }
  
  describe('asset manager', () =>{
    it('should generate with a folder requiring asset manager', () => {
      expect(getGenerateArgument(0)).toBe(folderRequiringAssetManager);
    })
    it('should use System', () => {
      expect(mockCreateFolderRequiringAssetManager.mock.calls[0][0]).toBeInstanceOf(System);
    })
    it('should use real require', () => {
      expect(mockCreateFolderRequiringAssetManager.mock.calls[0][1]).toBe(requirer);
    })
    it('should use a SuffixComponentSorter', () => {
      expect(mockCreateFolderRequiringAssetManager.mock.calls[0][2]).toBeInstanceOf(SuffixComponentSorter);
    })
  })

  describe('generatedReadme', () => {
    it('should be GeneratedReadme', () => {
      expect(getGenerateArgument(1)).toBeInstanceOf(GeneratedReadme);
    })
    it('should use markdownCodeCreator', () => {
      expect(mockGeneratedReadme.mock.calls[0][0]).toBe(markdownCodeCreator);
    })
    it('should createMarkdownImageCreator with real encoder', () => {
      expect(mockCreateMarkdownImageCreator).toHaveBeenCalledWith(encoder);
      expect(mockGeneratedReadme.mock.calls[0][1]).toBe(markdownImageCreator);
    });
    it('should use the newlineSpacer', () => {
      expect(mockGeneratedReadme.mock.calls[0][2]).toBe(newlineSpacer);
    })
  })
  
  describe('generatedReadmeWriter', () => {
    it('should write to README.md', () => {
      expect(getGenerateArgument(2)).toBe(generatedReadmeWriter);
    });
    it('should use System', () => {
      expect(mockCreateGeneratedReadmeWriter.mock.calls[0][0]).toBeInstanceOf(System);
    })
  })

  describe('puppeteer', () => {
    it('should be PuppeteerImageGeneratorWriter', () => {
      expect(getGenerateArgument(3)).toBeInstanceOf(PuppeteerImageGeneratorWriter);
    })
    it('should use generateMultipleWithPuppeteer', () => {
      expect(mockPuppeteerImageGeneratorWriter.mock.calls[0][0]).toBe(generateMultipleWithPuppeteer);
    })
    it('should use System', () => {
      expect(mockPuppeteerImageGeneratorWriter.mock.calls[0][1]).toBeInstanceOf(System);
    })
  })
})