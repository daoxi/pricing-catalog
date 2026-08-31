export type CatalogLayout = "Price First" | "Specs First";

export type CardSet = "A" | "B";

export interface SmartphoneAttributes {
  weight?: string;
  build?: string;
  resolution?: string;
  chipset?: string;
  memory?: string;
  headphoneJack?: string;
  battery?: string;
  repairability?: string;
}

export interface ProductImageData {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: "Android" | "iOS";
  priceLoggedOut: number;
  priceAuthenticated: number;
  cardSet: CardSet;
  attributes: SmartphoneAttributes;
  image?: ProductImageData;
}

export type CatalogData =
  | {
      status: "success";
      products: Product[];
      layouts: CatalogLayout[];
    }
  | {
      status: "error";
      products: [];
      layouts: [];
    };
