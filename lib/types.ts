export type Status = "visited" | "wishlist";
export type Country = {
  code: string;
  alpha3: string;
  numeric: string;
  name: string;
  official: string;
  flag: string;
  capital: string;
  continent: string;
  subregion: string;
  languages: string[];
  currencies: string[];
  lat: number;
  lng: number;
  counted: boolean;
  area: number;
  search: string;
};
export type PlaceEntry = {
  id: string;
  name: string;
  region: string;
  city: string;
  date: string;
};
export type CountryRecord = {
  status?: Status;
  favorite: boolean;
  date: string;
  notes: string;
  places: PlaceEntry[];
};
export type Stop = {
  country: string;
  city: string;
  days: number;
  daily: number;
};
export type Trip = {
  id: string;
  name: string;
  start: string;
  travelers: number;
  budget: number;
  transport: number;
  stops: Stop[];
  notes: string;
};
export type Profile = {
  name: string;
  bio: string;
  home: string;
  avatar: string;
};
export type TravelData = {
  version: 1;
  profile: Profile;
  records: Record<string, CountryRecord>;
  trips: Trip[];
  theme: "atlas" | "ocean" | "paper";
  updatedAt: string;
};
export type Guide = {
  tag: string;
  intro: string;
  image?: string;
  photoCredit?: string;
  cities: { name: string; region: string; places: string[] }[];
};
