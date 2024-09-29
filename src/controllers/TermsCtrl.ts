import { Request, Response, NextFunction } from "express";
import { FilterQuery } from "mongoose";
import { NotFound } from "http-errors";
import { ITerm, Term, TERM_LEVELS_ARRAY, TermForUpdate, TermLevel } from "../models";
import { IError, IJsonResponse } from "../interfaces";
import { ChangeLevelActions } from "../enums";
import { DISAPPEARANCE_TERM_DATE_BY_LEVELS } from "../utils";

interface ICardsListFilter {
  page?: number;
  perPage?: number;
  sort?: string;
  searchQuery?: string;
  level?: TermLevel;
}

class TermsCtrl {
  private readonly MIN_TERM_LEVEL = TERM_LEVELS_ARRAY[0];
  private readonly MAX_TERM_LEVEL = TERM_LEVELS_ARRAY[TERM_LEVELS_ARRAY.length - 1];

  getAll = async (
    req: Request<{}, {}, {}, ICardsListFilter>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { _id } = req.user!;
      const { page = 1, perPage = 10, searchQuery = "", level, sort } = req.query;

      const pageNum = Number(page);
      const perPageNum = Number(perPage);
      const skip = pageNum * perPageNum;

      const filterQuery: FilterQuery<ITerm> = {
        owner: _id,
      };

      if (level !== undefined) {
        filterQuery.level = level;
      }

      if (searchQuery.trim()) {
        filterQuery.$or = [
          { term: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search in 'term'
          { definition: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search in 'definition'
        ];
      }

      interface ISort {
        createdAt?: string | number;
        dateLevelWasChanged?: string | number;
      }
      let sortArguments: ISort = { createdAt: "desc" };

      if (sort === "createAsc") {
        sortArguments = { createdAt: "asc" };
      } else if (sort === "createDesc") {
        sortArguments = { createdAt: "desc" };
      } else if (sort === "lvlChangeAsc") {
        sortArguments = { dateLevelWasChanged: "asc" };
      } else if (sort === "lvlChangeDesc") {
        sortArguments = { dateLevelWasChanged: "desc" };
      }

      console.log(`sortArguments`, sortArguments);

      const terms = await Term.find(filterQuery)
        .skip(skip)
        .limit(perPageNum)
        .sort(sortArguments)
        .exec();

      const totalItems = await Term.countDocuments(filterQuery);

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: {
          items: terms,
          totalItems,
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

        if (!term.dateLevelWasChanged) {
          return true;
        }

        const dateLevelWasChangedInMilliseconds =
          typeof term.dateLevelWasChanged === "number"
            ? term.dateLevelWasChanged
            : Date.parse(term.dateLevelWasChanged.toDateString());

        const differenceBetweenDate = Date.now() - dateLevelWasChangedInMilliseconds;
        const isTimeUp = differenceBetweenDate >= DISAPPEARANCE_TERM_DATE_BY_LEVELS[term.level];

        return isTimeUp;
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

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { termId } = req.params;
      const { _id } = req.user!;

      const update = structuredClone(req.body as TermForUpdate);

      if (update.level !== undefined) {
        update.dateLevelWasChanged = null;
      }

      const updatedTerm = await Term.findOneAndUpdate(
        {
          owner: _id,
          _id: termId,
        },
        update,
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
      next(error);
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { termId } = req.params;
      const { _id } = req.user!;

      const term = await Term.findOne({
        owner: _id,
        _id: termId,
      });

      if (!term) {
        throw new NotFound(`Term with id=${termId} not found`);
      }

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: term,
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { termId } = req.params;
      const { _id } = req.user!;

      const deletedTerm = await Term.findOneAndDelete({
        owner: _id,
        _id: termId,
      });

      if (!deletedTerm) {
        throw new NotFound(`Term with id=${termId} not found`);
      }

      res.status(204).json();
    } catch (error) {
      next(error);
    }
  };
}

export { TermsCtrl };
