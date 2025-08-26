// src/services/logs.ts
/* eslint-disable no-console */
type Any = unknown;

export const log = (...args: Any[]) => {
  // Keep silent during tests if you want
  if (process.env.NODE_ENV === 'test') return;
  console.log(...args);
};

export const warn = (...args: Any[]) => {
  if (process.env.NODE_ENV === 'test') return;
  console.warn(...args);
};

export const error = (...args: Any[]) => {
  if (process.env.NODE_ENV === 'test') return;
  console.error(...args);
};