import { ResolvedObjectPathFinder } from '../src/asset-management/ResolvedObjectPathFinder';

describe('ResolvedObjectPathFinder getResolvedPath', () => {
  it('should return the path of the cached module with exports having property with value the resolved object', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = {
      'not a match':{exports:{prop:{}}},
      'the match':{
        exports:{
          default:resolvedObject
        }
      }
    }
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder(fakeRequire as any);
    expect(resolvedObjectPathFinder.getResolvedPath(resolvedObject)).toBe('the match');
  });

  it('should return undefined if no cache', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = undefined as any;
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder(fakeRequire as any);
    expect(resolvedObjectPathFinder.getResolvedPath(resolvedObject)).toBeUndefined();
  })

  it('should return undefined if no match', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = {
      'not a match':{exports:{prop:{}}},
    }
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder(fakeRequire as any);
    expect(resolvedObjectPathFinder.getResolvedPath(resolvedObject)).toBeUndefined();
  });

  it('should not throw if no module for the cache key', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = {
      'not a match':undefined,
    }
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder(fakeRequire as any);
    expect(resolvedObjectPathFinder.getResolvedPath(resolvedObject)).toBeUndefined();
  })
})