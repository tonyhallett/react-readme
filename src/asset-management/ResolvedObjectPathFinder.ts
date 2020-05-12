import { IResolvedObjectPathFinder } from "./RequiringComponentFolderOptionsProvider";
import { IRequirer } from "../interfaces";

export class ResolvedObjectPathFinder implements IResolvedObjectPathFinder{
  constructor(private readonly requirer:IRequirer){}
  resolve(resolvedObject: any, exclude:string): {path:string,key:string|undefined}|undefined {
    if(this.requirer.require.cache){
      const cacheKeys = Object.keys(this.requirer.require.cache)
      for(let j=0;j<cacheKeys.length;j++){
        const cacheKey = cacheKeys[j];
        const cached = this.requirer.require.cache[cacheKey];
        if(cached){
          const exports = cached.exports;
          if(exports === resolvedObject){
            if(cacheKey!==exclude){
              return {
                path:cacheKey,
                key:undefined
              }            }
          }
          const keys = Object.keys(exports);
          for(let i = 0;i< keys.length ;i++){
            const key = keys[i];
            if(exports[key] === resolvedObject){
              if(cacheKey!==exclude){
                return {
                  path:cacheKey,
                  key
                }  
              }
            }
          }
        }
      }
    }
  }
}