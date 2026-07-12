// Profile shape used by the account screens. The data itself lives on the
// BACKEND (the signed-in user record) — nothing personal is persisted on the
// device anymore, so a shared phone can never show the previous user's details.

export type Address = {
  line1: string;
  city: string;
  area: string;
};

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  address: Address | null;
};
