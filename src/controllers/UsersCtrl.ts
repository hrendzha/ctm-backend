import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as generateRandomString } from "uuid";
import { Unauthorized, Forbidden, NotFound, BadRequest } from "http-errors";
import path from "path";
import fs from "fs/promises";
import Jimp from "Jimp";
import { IUser, User, Subscription } from "models";
import { EmailSender } from "utils";
import { IJsonResponse, IEmailSenderData, IError, IJwtPayload } from "interfaces";
import { getEmailConfirmationHtmlTemplate } from "html-email-templates";

class UsersCtrl {
  private isVerificationRequired = false;
  private SECRET_KEY = process.env.SECRET_KEY as string;
  private IMAGE_STORE = path.join(process.cwd(), "public", "avatars");

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as IUser;
      const user = await User.findOne({ email });

      if (user) {
        const json: IJsonResponse<object> = {
          statusMessage: `This email is already taken`,
          statusCode: 409,
          data: {
            fieldInWhichErrorOccurred: "email",
          },
        };
        res.status(409).json(json);
        return;
      }

      const hashedPass = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      const verificationToken = this.isVerificationRequired ? generateRandomString() : "";

      await User.create({
        name,
        email,
        password: hashedPass,
        verificationToken,
      });

      if (this.isVerificationRequired) {
        const emailData: IEmailSenderData = {
          recipientsEmail: email,
          subject: "Email confirmation",
          html: getEmailConfirmationHtmlTemplate(verificationToken),
        };
        const emailSender = new EmailSender(emailData);

        await emailSender.send();
      }

      const json: IJsonResponse<null> = {
        statusMessage: this.isVerificationRequired ? "Verification email sent" : "Success",
        statusCode: 201,
        data: null,
      };
      res.json(json);
    } catch (error) {
      if (error instanceof Error && error.message.includes("validation failed")) {
        const e: IError = error;
        e.statusCode = 400;
        next(e);
        return;
      }

      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password }: { email: string; password: string } = req.body;

      const user = await User.findOne({ email });

      if (this.isVerificationRequired && !user?.verify) {
        throw new Forbidden("Confirm your email address");
      }

      if (!user || !user.comparePasswords(password)) {
        throw new Unauthorized("Email or password is wrong");
      }

      const payload: IJwtPayload = { id: user._id };
      const token = jwt.sign(payload, this.SECRET_KEY, { expiresIn: "8h" });
      await User.findByIdAndUpdate(user._id, { token });

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: {
          token,
          name: user.name,
          email: user.email,
          subscription: user.subscription,
        },
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };

  getCurrent = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, subscription, avatarURL, token } = req.user as IUser;

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: { name, email, subscription, avatarURL, token },
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _id } = req.user as IUser;

      const user = await User.findByIdAndUpdate(_id, { token: null });
      if (!user) {
        throw new Unauthorized("Not authorized");
      }

      res.status(204).json();
    } catch (error) {
      next(error);
    }
  };

  updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _id, subscription: currentSubscription } = req.user as IUser;
      const { subscription }: { subscription: Subscription } = req.body;

      if (currentSubscription === subscription) {
        const json: IJsonResponse<null> = {
          statusMessage: `Subscription ${subscription} already set`,
          statusCode: 409,
          data: null,
        };
        res.status(409).json(json);
        return;
      }

      const user = await User.findByIdAndUpdate(_id, { subscription }, { new: true });
      if (!user) {
        throw new Unauthorized("Not authorized");
      }

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: {
          email: user.email,
          subscription: user.subscription,
        },
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };

  updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      const json: IJsonResponse<null> = {
        statusMessage: "File required",
        statusCode: 400,
        data: null,
      };
      res.status(400).json(json);
      return;
    }

    const { path: temporaryFilePath, mimetype } = req.file;
    const { _id } = req.user!;

    const fileExtension = mimetype.slice(mimetype.lastIndexOf("/") + 1);
    const uniqFileName = `${_id}.${fileExtension}`;
    const permanentFileLocation = path.join(this.IMAGE_STORE, uniqFileName);
    const avatarURL = path.join("avatars", uniqFileName);

    try {
      const img = await Jimp.read(temporaryFilePath);
      img.resize(250, 250).write(permanentFileLocation);
      const updatedUser = await User.findByIdAndUpdate(_id, { avatarURL }, { new: true });

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: {
          avatarURL: updatedUser?.avatarURL,
        },
      };
      res.json(json);
    } catch (err) {
      return next(err);
    } finally {
      await fs.unlink(temporaryFilePath);
    }
  };

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { verificationToken } = req.params;

      const user = await User.findOneAndUpdate(
        { verificationToken },
        {
          verificationToken: null,
          verify: true,
        },
        { new: true }
      );

      if (!user) {
        throw new NotFound("User not found or verification has already been passed");
      }

      const json: IJsonResponse<null> = {
        statusMessage: "Verification successful",
        statusCode: 200,
        data: null,
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };

  getEmailConfirmationCodeAgain = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email }: { email: string } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        throw new NotFound("User not found");
      }

      if (user.verify) {
        throw new BadRequest("Verification has already been passed");
      }

      const verificationToken = user.verificationToken || generateRandomString();

      await User.findByIdAndUpdate(user._id, { verificationToken }, { new: true });

      const emailData: IEmailSenderData = {
        recipientsEmail: email,
        subject: "Email confirmation",
        html: getEmailConfirmationHtmlTemplate(verificationToken),
      };
      const emailSender = new EmailSender(emailData);
      await emailSender.send();

      const json: IJsonResponse<null> = {
        statusMessage: "Verification email sent",
        statusCode: 200,
        data: null,
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };
}

export { UsersCtrl };
