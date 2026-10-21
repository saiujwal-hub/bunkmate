export interface Subject {
  id: string;
  name: string;
  credits: number;
  bunksUsed: number;
}

/** A subject being typed into the setup form, before it becomes a tracked one. */
export interface SubjectDraft {
  key: string;
  name: string;
  credits: string;
}

/** Shared problem found in one subject's inputs, shown in chalk pink. */
export interface RowError {
  text: string;
}

export const POSITIVE_INT_RE = /^(0|[1-9]\d*)$/;
