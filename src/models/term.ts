import { Schema, model } from "mongoose";
import Joi from "joi";
import { ChangeLevelActions } from "../enums";

const TERM_FIELDS_LENGTH = {
  term: {
    min: 1,
    max: 1000,
  },
  definition: {
    min: 1,
    max: 1000,
  },
  imageUrl: {
    max: 1000,
  },
};
export const TERM_LEVELS_ARRAY: readonly [0, 1, 2, 3, 4, 5, 6] = [0, 1, 2, 3, 4, 5, 6];
export type TermLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface ITerm {
  owner: Schema.Types.ObjectId;
  term: string;
  definition: string;
  imageUrl: string;
  level: TermLevel;
  dateLevelWasChanged?: Date | number | null;
  differenceBetweenDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TermForUpdate = Partial<
  Pick<ITerm, "term" | "definition" | "level" | "dateLevelWasChanged" | "imageUrl">
>;

const termSchema = new Schema<ITerm>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    term: {
      type: String,
      minlength: TERM_FIELDS_LENGTH.term.min,
      maxlength: TERM_FIELDS_LENGTH.term.max,
      required: [true, "term required"],
      trim: true,
    },
    definition: {
      type: String,
      minlength: TERM_FIELDS_LENGTH.definition.min,
      maxlength: TERM_FIELDS_LENGTH.definition.max,
      required: [true, "definition required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      maxlength: TERM_FIELDS_LENGTH.imageUrl.max,
      default: "",
      trim: true,
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
  term: Joi.string().min(TERM_FIELDS_LENGTH.term.min).max(TERM_FIELDS_LENGTH.term.max).required(),
  definition: Joi.string()
    .min(TERM_FIELDS_LENGTH.definition.min)
    .max(TERM_FIELDS_LENGTH.definition.max)
    .required(),
  imageUrl: Joi.string().max(TERM_FIELDS_LENGTH.imageUrl.max),
});

const validationUpdateTermSchema = Joi.object({
  term: Joi.string().min(TERM_FIELDS_LENGTH.term.min).max(TERM_FIELDS_LENGTH.term.max),
  definition: Joi.string()
    .min(TERM_FIELDS_LENGTH.definition.min)
    .max(TERM_FIELDS_LENGTH.definition.max),
  imageUrl: Joi.string().empty("").max(TERM_FIELDS_LENGTH.imageUrl.max),
  level: Joi.number().valid(...TERM_LEVELS_ARRAY),
});

const validationChangeLevelSchema = Joi.object({
  action: Joi.number()
    .valid(ChangeLevelActions.Lower, ChangeLevelActions.Keep, ChangeLevelActions.Raise)
    .required(),
});

const Term = model<ITerm>("term", termSchema);

export { Term, validationTermSchema, validationChangeLevelSchema, validationUpdateTermSchema };
