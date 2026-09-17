export class UseCaseDouble<Input = unknown, Result = unknown> {
  public readonly calls: Input[] = [];
  private result: Result | undefined;
  private error: unknown;
  private hasError = false;

  willResolve(result: Result): this {
    this.result = result;
    this.hasError = false;
    return this;
  }

  willReject(error: unknown): this {
    this.error = error;
    this.hasError = true;
    return this;
  }

  get lastCall(): Input | undefined {
    return this.calls[this.calls.length - 1];
  }

  execute = async (...args: unknown[]): Promise<Result> => {
    this.calls.push(args[0] as Input);
    if (this.hasError) throw this.error;
    return this.result as Result;
  };
}
