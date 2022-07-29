import mongoose from "mongoose";

class Database {
  private DB_HOST = process.env.DB_HOST || "";

  async init() {
    const { DB_HOST } = this;

    try {
      await mongoose.connect(DB_HOST);
      console.log("Database connection successful");
    } catch (error) {
      throw new Error("Database connection error");
    }
  }
}

export { Database };
