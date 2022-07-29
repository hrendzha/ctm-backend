import { Request, Response, NextFunction } from "express";
import { NotFound } from "http-errors";
import { Term, TERM_LEVELS_ARRAY, TermLevel } from "models";
import { IError, IJsonResponse } from "interfaces";
import { ChangeLevelActions } from "enums";
import { DISAPPEARANCE_TERM_DATE_BY_LEVELS } from "utils";

class TermsCtrl {
  private readonly MIN_TERM_LEVEL = TERM_LEVELS_ARRAY[0];
  private readonly MAX_TERM_LEVEL = TERM_LEVELS_ARRAY[TERM_LEVELS_ARRAY.length - 1];

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _id } = req.user!;

      const terms = await Term.find({ owner: _id });

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: {
          items: terms,
        },
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };

  getAllForLearn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _id } = req.user!;

      const terms = await Term.find({ owner: _id });

      const filteredTerms = terms.filter(term => {
        if (term.level === this.MIN_TERM_LEVEL) return true;
        if (term.level === this.MAX_TERM_LEVEL) return false;

        const dateLevelWasChangedInMilliseconds = Date.parse(
          term.dateLevelWasChanged?.toDateString()!
        );
        const differenceBetweenDate = Date.now() - dateLevelWasChangedInMilliseconds;
        const isTimeUp = differenceBetweenDate >= DISAPPEARANCE_TERM_DATE_BY_LEVELS[term.level];

        for (const LEVEL of TERM_LEVELS_ARRAY) {
          if (term.level === LEVEL && isTimeUp) {
            return true;
          }
        }

        return false;
      });

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: {
          items: filteredTerms,
        },
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _id } = req.user!;
      const newTerm = await Term.create({ ...req.body, owner: _id });

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 201,
        data: newTerm,
      };
      res.status(201).json(json);
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

  determineNemTermLevel = ({
    currentLevel,
    action,
  }: {
    currentLevel: TermLevel;
    action: ChangeLevelActions;
  }) => {
    let newLevel = currentLevel;

    switch (action) {
      case ChangeLevelActions.Lower:
        newLevel = (currentLevel - 1) as TermLevel;
        break;

      case ChangeLevelActions.Keep:
        newLevel = currentLevel;
        break;

      case ChangeLevelActions.Raise:
        newLevel = (currentLevel + 1) as TermLevel;
        break;

      default:
        console.log(`Unknown action: ${action}`);
        break;
    }

    if (newLevel < this.MIN_TERM_LEVEL) {
      newLevel = this.MIN_TERM_LEVEL;
    }

    if (newLevel > this.MAX_TERM_LEVEL) {
      newLevel = this.MAX_TERM_LEVEL;
    }

    return newLevel;
  };

  changeTermLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { termId } = req.params;
      const { _id } = req.user!;
      const { action }: { action: ChangeLevelActions } = req.body;

      const term = await Term.findOne({
        owner: _id,
        _id: termId,
      });

      if (!term) {
        throw new NotFound(`Term with id=${termId} not found`);
      }

      const newTermLevel = this.determineNemTermLevel({ currentLevel: term.level, action });

      const newTermData: { level: TermLevel; dateLevelWasChanged?: number } = {
        level: newTermLevel,
      };

      if (action === ChangeLevelActions.Raise) {
        newTermData.dateLevelWasChanged = Date.now();
      }

      const updatedTerm = await Term.findOneAndUpdate(
        {
          owner: _id,
          _id: termId,
        },
        newTermData,
        { new: true }
      );

      if (!updatedTerm) {
        throw new NotFound(`Term with id=${termId} not found`);
      }

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: updatedTerm,
      };
      res.json(json);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cast to ObjectId failed")) {
        const e: IError = error;
        e.statusCode = 400;
        next(e);
        return;
      }

      next(error);
    }
  };
}

export { TermsCtrl };
