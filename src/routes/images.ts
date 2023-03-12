import express from "express";
import { ImagesCtrl } from "../controllers";

const imagesRouter = express.Router();
const imagesCtrl = new ImagesCtrl();

imagesRouter.get("/", imagesCtrl.get);

export { imagesRouter };
