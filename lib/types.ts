export interface Role{
    ADMIN: "ADMIN";
    VENDOR: "VENDOR";
    CUSTOMER: "CUSTOMER";
}
export interface Session {
  jwt: string,
}
export interface Address {
  id: string,
  name: string,
  longitude: number,
  latitude: number,
}
export interface User {
  id: number,
  fullName: string,
  email: string,
  favouriteVendors: Vendor[],
  orders: Order[],
  addresses: Address[],
}
export interface Category {
  id: string;
  name: string;
  slug: string;
}
export interface Order {
  id: number,
  user: User,
  vendor: Vendor,
  condition: number,
  products: [],
  price: number,
}
export interface Vendor {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  closingHours: string;
  products: Product[];
  isFavourite: boolean;
}
export interface Product {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: string;
  onSale: boolean;
  vendor: Vendor;
  stock: number | null;
  imageUrl: string | null;
}
export interface CartItem {
  product: Product,
  quantity: number
}

export interface Cart {
  products: CartItem[]
}