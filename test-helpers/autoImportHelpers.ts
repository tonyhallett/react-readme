interface Constructable {
  new (...args: any[]): any;
}
export class MockReturnValueOnces<T>{
  private constructor(public readonly values:Array<T>){}
  static create<T>(values:Array<T>){
    return new MockReturnValueOnces(values);
  }

}
function setMockedMethod(mocked:any,method:any,implOrReturn:any){
  if(jest.isMockFunction(implOrReturn)){
    mocked[method] = implOrReturn;
  }else{
    if(implOrReturn instanceof MockReturnValueOnces){
      implOrReturn.values.forEach(mockReturnValueOnce => {
        mocked[method].mockReturnValueOnce(mockReturnValueOnce);
      });
    }else{
      mocked[method].mockReturnValue(implOrReturn);
    }
    
  }
}

type NonUndefined<A> = A extends undefined ? never : A;
type FunctionKeys<T extends object> = {
  [K in keyof T]-?:NonUndefined<T[K]> extends Function ? K :never
}[keyof T];


type PropOrReturn<T extends object> =  {
  [P in FunctionKeys<T>]: T[P]|ReturnType<T[P]>|MockReturnValueOnces<ReturnType<T[P]>>
};
type PartialPropOrReturn<T extends object> = Partial<PropOrReturn<T>>

export function createInstanceAndChangeMethods<T extends Constructable>(
  mockClass:jest.MockedClass<T>,
  implementations:PartialPropOrReturn<InstanceType<T>>
  ):InstanceType<T>{
  const instance = new mockClass();
  Object.keys(implementations).forEach(key => {
    const impl = (implementations as any)[key];
    setMockedMethod(instance,key,impl);
  })
  return instance;
}

export function createInstanceAndChangeMethod<T extends Constructable,U extends keyof InstanceType<T>>(
  mockClass:jest.MockedClass<T>,
  method:U,
  implOrReturn:InstanceType<T>[U]|ReturnType<InstanceType<T>[U]>):InstanceType<T>{

  const instance = new mockClass();
  setMockedMethod(instance,method, implOrReturn);

  return instance;
}
export function create<T extends Constructable>(
  mockClass:jest.MockedClass<T>
):InstanceType<T>{
  return new mockClass();
}

