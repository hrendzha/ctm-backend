import { ValidationErrorItem } from "joi";

interface IError extends Error {
  statusCode?: number;
  details?: ValidationErrorItem[];
}

export { IError };
