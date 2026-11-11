export type AuthUser = { email: string; id: string; name: string; role: string };
export type AuthState =
  | { mode: "demo"; user: null; providers: { google: false; github: false } }
  | { mode: "auth"; user: AuthUser | null; providers: { google: boolean; github: boolean } };
