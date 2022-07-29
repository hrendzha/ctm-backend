import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Unauthorized } from "http-errors";
import Joi from "joi";
import multer from "multer";
import path from "path";
import { User } from "models";
import { IJwtPayload, IError } from "interfaces";

class Middleware {
  private static instance: Middleware;

  private SECRET_KEY: jwt.Secret = process.env.SECRET_KEY || "";
  private uploadDir = path.join(process.cwd(), "tmp");
  private storage = multer.diskStorage({
    destination: this.uploadDir,
    filename: (_, file, cb) => {
      cb(null, file.originalname);
    },
  });

  public uploadMiddleware = multer({ storage: this.storage });

  constructor() {
    if (!Middleware.instance) {
      Middleware.instance = this;
    }

    return Middleware.instance;
  }

  auth = async (req: Request, _: Response, next: NextFunction) => {
    try {
      const { authorization = "" } = req.headers;
      const [bearer, token] = authorization.split(" ");

      if (bearer !== "Bearer") {
        throw new Unauthorized("Not authorized");
      }

      const { id } = jwt.verify(token, this.SECRET_KEY) as IJwtPayload;
      const user = await User.findById(id);

      if (!user || !user.token) {
        throw new Unauthorized("Not authorized");
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof Error) {
        const e: IError = error;
        if (
          e.message === "invalid signature" ||
          e.message === "jwt expired" ||
          e.message === "invalid token" ||
          e.message === "jwt malformed"
        ) {
          e.statusCode = 401;
          next(e);
          return;
        }
      }

      next(error);
    }
  };

  validation = (schema: Joi.ObjectSchema) => {
    return (req: Request, _: Response, next: NextFunction) => {
      const { error } = schema.validate(req.body);

      if (error) {
        const e: IError = error;
        e.statusCode = 400;
        if (e.details) {
          e.message = e.details[0].message;
        }
        next(e);
        return;
      }

      next();
    };
  };

  upload = () => {
    return this.uploadMiddleware;
  };
}

export { Middleware };
