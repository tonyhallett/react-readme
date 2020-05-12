import { ResolvedObjectPathFinder } from '../src/asset-management/ResolvedObjectPathFinder';

describe('ResolvedObjectPathFinder getResolvedPath', () => {
  it('should return the path and key of the cached module with exports having property with value the resolved object', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = {
      'not a match':{exports:{prop:{}}},
      'the match':{
        exports:{
          key:resolvedObject
        }
      }
    }
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder({require:fakeRequire as any});
    const resolved = resolvedObjectPathFinder.resolve(resolvedObject,'')!;
    expect(resolved.path).toBe('the match');
    expect(resolved.key).toBe('key');
  });
  it('should return the path of the cached module with exports being the resolved object', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = {
      'not a match':{exports:{prop:{}}},
      'the match':{
        exports:resolvedObject
      }
    }
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder({require:fakeRequire as any});
    const resolved = resolvedObjectPathFinder.resolve(resolvedObject,'')!
    expect(resolved.path).toBe('the match');
    expect(resolved.key).toBeUndefined();
  })
  it('should exclude the given module from matching', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = {
      'not a match':{exports:{prop:{}}},
      'the match':{
        exports:{
          key:resolvedObject
        }
      }
    }
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder({require:fakeRequire as any});
    const resolved = resolvedObjectPathFinder.resolve(resolvedObject,'the match');
    expect(resolved).toBeUndefined();
  })
  //it should ignore the resolved path

  it('should return undefined if no cache', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = undefined as any;
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder({require:fakeRequire as any});
    expect(resolvedObjectPathFinder.resolve(resolvedObject,'')).toBeUndefined();
  })

  it('should return undefined if no match', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = {
      'not a match':{exports:{prop:{}}},
    }
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder({require:fakeRequire as any});
    expect(resolvedObjectPathFinder.resolve(resolvedObject,'')).toBeUndefined();
  });

  it('should not throw if no module for the cache key', () => {
    const resolvedObject = {};
    const fakeRequire = ()=>{};
    fakeRequire.cache = {
      'not a match':undefined,
    }
    const resolvedObjectPathFinder = new ResolvedObjectPathFinder({require:fakeRequire as any});
    expect(resolvedObjectPathFinder.resolve(resolvedObject,'')).toBeUndefined();
  })
})