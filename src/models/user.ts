import { Model, Schema, model, Types } from "mongoose";
import Joi from "joi";
import bcrypt from "bcryptjs";

export type Subscription = "starter" | "pro" | "business";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  password: string;
  email: string;
  subscription: Subscription;
  avatarURL: string;
  token: string | null;
  verify: boolean;
  verificationToken: string;
  isLearnFreeze: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  comparePasswords(password: string): boolean;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minLength: [2, "The minimum length of the name must be 2 characters"],
      maxLength: [35, "The maximum length of the name must be 35 characters"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },
    avatarURL: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      default: null,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: "",
    },
    isLearnFreeze: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

userSchema.methods.comparePasswords = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const joiUserSchema = Joi.object({
  name: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().email().required(),
  subscription: Joi.string().valid("starter", "pro", "business"),
  token: Joi.string(),
});

const joiSignUpSchema = Joi.object({
  name: Joi.string().required().min(2).max(35),
  password: Joi.string().required(),
  email: Joi.string().email().required(),
});

const joiAuthSchema = Joi.object({
  password: Joi.string().required(),
  email: Joi.string().email().required(),
});

const joiSubscriptionSchema = Joi.object({
  subscription: Joi.string().required().valid("starter", "pro", "business"),
});

const joiEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

const User = model<IUser, UserModel>("user", userSchema);

export {
  User,
  joiSignUpSchema,
  joiUserSchema,
  joiAuthSchema,
  joiSubscriptionSchema,
  joiEmailSchema,
};
