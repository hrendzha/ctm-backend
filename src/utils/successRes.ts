import { IJsonResponse } from "../interfaces";

const successRes = <T>(data: T): IJsonResponse<T> => ({
  statusMessage: "success",
  statusCode: 200,
  data,
});

export { successRes };
