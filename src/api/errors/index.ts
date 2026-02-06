export class AppError extends Error {
  readonly statusCode: number;
  readonly code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, code?: string) {
    super(`${resource} not found`, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, 401, code);
  }
}

export class WtfError extends AppError {
  constructor(message: string = 'Something went wrong', code?: string) {
    super(message, 500, code);
  }
}
