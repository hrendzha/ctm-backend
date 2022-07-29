import { Types } from "mongoose";

namespace NodeJS {
  interface ProcessEnv {
    DB_HOST: string;
    SECRET_KEY: string;
    SENDGRID_API_KEY: string;
    DEV_DOMAIN_NAME: string;
  }
}
