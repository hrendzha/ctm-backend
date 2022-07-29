import { Tcp } from "./Tcp";
import { Database } from "./Database";

class App {
  private static instance: App;

  private database = new Database();
  private tcp = new Tcp();

  constructor() {
    if (!App.instance) {
      App.instance = this;
    }

    return App.instance;
  }

  async init() {
    const { tcp, database } = this;
    try {
      await database.init();
      await tcp.init();
    } catch (error) {
      console.log("App init error", error);
    }
  }
}

export { App };
