export class UnexpectedError extends Error {
  readonly detail: any[];

  constructor(message?: string, details?: any) {
    super(message);
    this.name = 'UnexpectedError';
    this.detail = details;
  }
}
