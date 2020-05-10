import {SuffixComponentSorter} from '../src/SuffixComponentSorter';
import { SortedComponentFolder } from '../src/asset-management/AssetFolderProvider';

describe('SuffixComponentSorter', () => {
  it('sorts by suffix, no suffix at the end in order encountered', () => {
    const sorter = new SuffixComponentSorter();
    const sorted = sorter.sort(['NoSuffix2', 'ComponentX_2','NoSuffix1','ComponentY_1']);
    const expected:SortedComponentFolder[] = [
      {
        componentFolderName:'ComponentY_1',
        parsedName:'ComponentY'
      },
      {
        componentFolderName:'ComponentX_2',
        parsedName:'ComponentX'
      },
      {
        componentFolderName:'NoSuffix2',
        parsedName:'NoSuffix2'
      },
      {
        componentFolderName:'NoSuffix1',
        parsedName:'NoSuffix1'
      },
    ]
    expect(sorted).toEqual(expected)
  })

  it('should remove gaps', () => {
    const sorter = new SuffixComponentSorter();
    const sorted = sorter.sort(['NoSuffix2', 'ComponentX_3','NoSuffix1','ComponentY_1']);
    const expected:SortedComponentFolder[] = [
      {
        componentFolderName:'ComponentY_1',
        parsedName:'ComponentY'
      },
      {
        componentFolderName:'ComponentX_3',
        parsedName:'ComponentX'
      },
      {
        componentFolderName:'NoSuffix2',
        parsedName:'NoSuffix2'
      },
      {
        componentFolderName:'NoSuffix1',
        parsedName:'NoSuffix1'
      },
    ]
    expect(sorted).toEqual(expected)
  })
})