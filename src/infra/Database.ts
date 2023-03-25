import mongoose from "mongoose";

class Database {
  private readonly DB_HOST =
    process.env.NODE_ENV === "production" ? process.env.DB_HOST_PROD : process.env.DB_HOST_DEV;

  async init() {
    const { DB_HOST = "" } = this;

    try {
      await mongoose.connect(DB_HOST);
      console.log("Database connection successful");
    } catch (error) {
      console.log(error);
      throw new Error("Database connection error");
    }
  }
}

export { Database };
