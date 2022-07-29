import { Schema, model } from "mongoose";
import Joi from "joi";
import { ChangeLevelActions } from "enums";

export const TERM_LEVELS_ARRAY: readonly [0, 1, 2, 3, 4, 5, 6] = [0, 1, 2, 3, 4, 5, 6];
export type TermLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ITerm {
  owner: Schema.Types.ObjectId;
  word: string;
  definition: string;
  imageUrl: string;
  level: TermLevel;
  dateLevelWasChanged?: Date;
  differenceBetweenDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const termSchema = new Schema<ITerm>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    word: {
      type: String,
      minlength: 1,
      maxlength: 1000,
      required: [true, "word required"],
      trim: true,
    },
    definition: {
      type: String,
      minlength: 1,
      maxlength: 1000,
      required: [true, "definition required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    level: {
      type: Number,
      enum: TERM_LEVELS_ARRAY,
      default: 0,
    },
    dateLevelWasChanged: {
      type: Date,
    },
    differenceBetweenDate: {
      type: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const validationTermSchema = Joi.object({
  word: Joi.string().min(1).max(1000).required(),
  definition: Joi.string().min(1).max(1000).required(),
});

const validationChangeLevelSchema = Joi.object({
  action: Joi.number()
    .valid(ChangeLevelActions.Lower, ChangeLevelActions.Keep, ChangeLevelActions.Raise)
    .required(),
});

const Term = model<ITerm>("term", termSchema);

export { Term, validationTermSchema, validationChangeLevelSchema };
