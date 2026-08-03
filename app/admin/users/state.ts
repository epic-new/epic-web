import { atom } from "jotai";

// --- UI state (Jotai) ---
// Server state (the users list and a user's sessions) lives in the TanStack
// Query cache. The atoms below are pure UI state that drive the query keys
// and client-only concerns.

// Pagination state
export const usersPageAtom = atom(1);
export const usersLimitAtom = atom(10);

// Filter/Search state
export const usersSearchAtom = atom("");
export const usersRoleFilterAtom = atom<string | undefined>(undefined);

// Sort state
export const usersSortByAtom = atom<string | undefined>(undefined);
export const usersSortDirectionAtom = atom<"asc" | "desc">("asc");
