import express from "express";
import { Middleware } from "../middleware/Middleware";
import { joiSignUpSchema, joiAuthSchema, joiSubscriptionSchema, joiEmailSchema } from "../models";
import { UsersCtrl } from "../controllers";

const middleware = new Middleware();
const usersRouter = express.Router();
const usersCtrl = new UsersCtrl();

usersRouter.post("/signup", middleware.validation(joiSignUpSchema), usersCtrl.signUp);

usersRouter.post("/login", middleware.validation(joiAuthSchema), usersCtrl.login);

usersRouter.get("/current", middleware.auth, usersCtrl.getCurrent);

usersRouter.get("/logout", middleware.auth, usersCtrl.logout);

usersRouter.patch(
  "/",
  middleware.auth,
  middleware.validation(joiSubscriptionSchema),
  usersCtrl.updateSubscription
);

usersRouter.patch(
  "/avatars",
  middleware.auth,
  middleware.upload().single("avatar"),
  usersCtrl.updateAvatar
);

usersRouter.get("/verify/:verificationToken", usersCtrl.confirmEmail);

usersRouter.post(
  "/verify",
  middleware.validation(joiEmailSchema),
  usersCtrl.getEmailConfirmationCodeAgain
);

export { usersRouter };
