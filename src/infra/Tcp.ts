import express, { Request, Response, NextFunction } from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import path from "path";
import { IError, IJsonResponse } from "../interfaces";
import { usersRouter, termsRouter, imagesRouter } from "../routes";
import { Middleware } from "../middleware/Middleware";

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
    server.use(
      cors({
        origin: process.env.NODE_ENV === "production" ? "https://ctm-front.netlify.app" : "*",
      })
    );
    server.use(express.json());
    if (process.env.NODE_ENV !== "production") {
      const logger = require("morgan");
      server.use(logger("dev"));
    }

    server.use("/api/users", usersRouter);
    server.use("/api/terms", middleware.auth, termsRouter);
    server.use("/api/images", middleware.auth, imagesRouter);

    server.use((req, res) => {
      const json: IJsonResponse<null> = {
        statusMessage: `Not found address 2 ${req.url}`,
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
        if (process.env.NODE_ENV !== "production") {
          server.listen(PORT, () => {
            console.log(`Tcp service running on port ${PORT}`);

            return res(true);
          });
        } else {
          const options = {
            key: fs.readFileSync("/etc/letsencrypt/live/ctm-api.online/privkey.pem"),
            cert: fs.readFileSync("/etc/letsencrypt/live/ctm-api.online/fullchain.pem"),
          };

          https.createServer(options, server).listen(PORT, () => {
            console.log(`HTTPS server listening on port ${PORT}`);

            return res(true);
          });
        }
      } catch (error) {
        console.log(`Tcp service not running`, error);
        rej(error);
      }
    });
  }
}

export { Tcp };
