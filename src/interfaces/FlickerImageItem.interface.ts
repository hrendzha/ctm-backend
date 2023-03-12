interface IFlickrImageItem {
  id: string;
  owner: string;
  secret: string;
  server: string;
  farm: number;
  title: string;
  ispublic: number;
  isfriend: number;
  isfamily: number;
  url_m: string;
  height_m: number;
  width_m: number;
}

export type { IFlickrImageItem };
