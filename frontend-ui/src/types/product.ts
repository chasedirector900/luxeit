export type ProductShippingMethod = "air" | "sea";
export type Warehouse = "china" | "zambia";
export type ProductType =
  | "footwear"
  | "watch"
  | "car_part"
  | "security"
  | "digital"
  | "general";

export type ProductMediaItem = {
  type: "image" | "video";
  src: string;
  alt?: string;
  title?: string;
  thumbnail?: string;
  objectFit?: "contain" | "cover";
};

export type ProductOption = {
  name: string;
  key: string;
  required?: boolean;
  values: string[];
  stockByValue?: Record<string, number>;
  note?: string;
};

export type ProductSpecGroup = {
  title: string;
  specs: Array<{ label: string; value: string }>;
};

export type ProductReviewTag = {
  label: string;
  count: number;
};

export type ProductReview = {
  id: string;
  userName: string;
  avatarInitial?: string;
  avatarUrl?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
  text: string;
  helpfulCount: number;
  images?: string[];
  sellerReply?: {
    author: string;
    date: string;
    text: string;
  };
};

export type ProductRatings = {
  ratingAverage: number;
  ratingCount: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  reviewTags: ProductReviewTag[];
  reviews: ProductReview[];
};

export type ProductCompatibility = {
  title: string;
  required?: boolean;
  fields: Array<{
    key: string;
    label: string;
    values: string[];
    required?: boolean;
  }>;
  note?: string;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  image: string;
  media?: ProductMediaItem[];
  productType?: ProductType;
  options?: ProductOption[];
  specGroups?: ProductSpecGroup[];
  compatibility?: ProductCompatibility;
  packageContents?: string[];
  notices?: string[];
  ratings?: ProductRatings;
  price: number;
  preorder?: boolean;
  importTag?: string;
  warehouse?: Warehouse;
  origin?: "China" | "Global";
  deliveryEstimate?: string;
  shippingMethod?: ProductShippingMethod;
  category?: string;
  popularityLabel?: string;
  searchableText?: string;
};
