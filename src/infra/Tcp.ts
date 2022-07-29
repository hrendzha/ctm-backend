import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import { IError, IJsonResponse } from "interfaces";
import { usersRouter, termsRouter } from "routes";
import { Middleware } from "middleware/Middleware";

class Tcp {
  private static instance: Tcp;

  private PORT = process.env.PORT || 4000;
  public middleware = new Middleware();

  public server = express();

  constructor() {
    if (!Tcp.instance) {
      Tcp.instance = this;
    }

    return Tcp.instance;
  }

  useExpressServer() {
    const { server, middleware } = this;

    server.use(express.static(path.join(process.cwd(), "public")));
    server.use(cors());
    server.use(express.json());
    server.use(morgan(server.get("env") !== "production" ? "dev" : "short"));

    server.use("/api/users", usersRouter);
    server.use("/api/terms", middleware.auth, termsRouter);
    server.use((req, res) => {
      const json: IJsonResponse<null> = {
        statusMessage: `Not found address ${req.url}`,
        statusCode: 404,
        data: null,
      };
      res.status(404).json(json);
    });
    server.use((err: IError, _: Request, res: Response, __: NextFunction) => {
      const { statusCode = 500, message = "Internal server error" } = err;
      const json: IJsonResponse<null> = {
        statusMessage: message,
        statusCode,
        data: null,
      };
      res.status(statusCode).json(json);
    });
  }

  async init() {
    const { server, PORT } = this;

    this.useExpressServer();

    return new Promise<boolean>((res: Function, rej: Function) => {
      try {
        server.listen(PORT, () => {
          console.log(`Tcp service running on port ${PORT}`);

          return res(true);
        });
      } catch (error) {
        console.log(`Tcp service not running`, error);
        rej(error);
      }
    });
  }
}

export { Tcp };
