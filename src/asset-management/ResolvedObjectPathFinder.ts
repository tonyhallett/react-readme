import { IResolvedObjectPathFinder } from "./RequiringComponentFolderOptionsProvider";

export class ResolvedObjectPathFinder implements IResolvedObjectPathFinder{
  constructor(private readonly requirer:NodeRequire){}
  getResolvedPath(resolvedObject: any): string | undefined {
    if(this.requirer.cache){
      const cacheKeys = Object.keys(this.requirer.cache)
      for(let j=0;j<cacheKeys.length;j++){
        const cacheKey = cacheKeys[j];
        const cached = this.requirer.cache[cacheKey];
        if(cached){
          const exports = cached.exports;
          const keys = Object.keys(exports);
          for(let i = 0;i< keys.length ;i++){
            const key = keys[i];
            if(exports[key] === resolvedObject){
             return cacheKey;
            }
          }
        }
      }
    }
  }
}