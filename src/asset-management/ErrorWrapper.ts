export class ErrorWrapper extends Error {
  private constructor(message: string, public readonly cause: any) {
    super(message);
  }
  static create(message: string, cause: any) {
    let fullMessage = message;
    if (cause.message) {
      fullMessage += '\n';
      fullMessage += cause.message;
    }
    return new ErrorWrapper(fullMessage, cause);
  }
}
