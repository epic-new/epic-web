/** Serializable result contract shared by Controller Actions and Presentation. */
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
