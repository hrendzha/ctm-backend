interface IPixabayImageItem {
  id: number;
  collections: number;
  comments: number;
  downloads: number;
  likes: number;
  views: number;
  tags: string;
  type: string;
  user: string;
  user_id: number;
  userImageURL: string;
  pageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  largeImageURL: string;
  previewWidth: number;
  previewHeight: number;
  previewURL: string;
  webformatWidth: number;
  webformatHeight: number;
  webformatURL: string;
}

export type { IPixabayImageItem };
