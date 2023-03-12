import { Request, Response, NextFunction } from "express";
import { IJsonResponse, IFlickrImageItem } from "../interfaces";
import fetch from "node-fetch";

class ImagesCtrl {
  private readonly IMAGES_URL = "https://api.flickr.com/services/rest";

  public get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, perPage = 10, searchQuery } = req.query;

      const searchParams = new URLSearchParams({
        api_key: String(process.env.IMAGES_API_KEY),
        method: "flickr.photos.search",
        format: "json",
        nojsoncallback: "1",
        media: "photos",
        sort: "relevance",
        extras: "url_m",
        text: String(searchQuery),
        page: String(page),
        per_page: String(perPage),
      });

      const response = await fetch(`${this.IMAGES_URL}?${searchParams}`);

      interface IData {
        photos: {
          page: number;
          pages: number;
          perpage: number;
          total: number;
          photo: IFlickrImageItem[];
        };
      }
      const data: IData = await response.json();

      console.log(`data`, data);

      const json: IJsonResponse<object> = {
        statusMessage: "Success",
        statusCode: 200,
        data: {
          total: data.photos.total,
          totalPages: data.photos.pages,
          page: data.photos.page,
          items: data.photos.photo.map(image => ({
            id: image.id,
            url: image.url_m,
            desc: image.title,
          })),
        },
      };
      res.json(json);
    } catch (error) {
      next(error);
    }
  };
}

export { ImagesCtrl };
