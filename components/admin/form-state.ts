/** The shape every admin Server Action returns to its form. */
export type AdminFormState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

export const IDLE: AdminFormState = { status: "idle" };
