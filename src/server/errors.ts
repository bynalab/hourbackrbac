export class ResourceAccessNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'ResourceAccessNotFoundError';
  }
}

export class ResourceAccessBadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceAccessBadRequestError';
  }
}
