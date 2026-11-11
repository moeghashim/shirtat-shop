import { AsyncLocalStorage } from "node:async_hooks";

/** Set only around an owner-issued sign-up. Public /sign-up/email stays closed. */
export const inviteSignUp = new AsyncLocalStorage<true>();
