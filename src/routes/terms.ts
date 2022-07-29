import express from "express";
import { Middleware } from "middleware/Middleware";
import { validationTermSchema, validationChangeLevelSchema } from "models";
import { TermsCtrl } from "controllers";

const middleware = new Middleware();
const termsRouter = express.Router();
const termsCtrl = new TermsCtrl();

termsRouter.get("/", termsCtrl.getAll);

termsRouter.get("/for-learn", termsCtrl.getAllForLearn);

termsRouter.post("/", middleware.validation(validationTermSchema), termsCtrl.create);

termsRouter.patch(
  "/:termId/level",
  middleware.validation(validationChangeLevelSchema),
  termsCtrl.changeTermLevel
);

export { termsRouter };
