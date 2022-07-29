interface IJsonResponse<T> {
  statusMessage: string;
  statusCode: number;
  data: T;
}

export { IJsonResponse };
