import type { Context } from "hono";
import { UpstreamError, upstreamErrorResponse } from "./upstream.ts";

// A request the client got wrong: answered with its status and message.
export class HttpError extends Error {
  readonly status: 400 | 404;
  constructor(status: 400 | 404, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (message: string) => new HttpError(404, message);

// The status and text an error is answered with. Anything unexpected (a
// database error, a bug) is a 500 without its message: that goes to the logs.
export const errorStatusAndMessage = (
  error: unknown,
): { status: number; message: string } => {
  if (error instanceof HttpError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof UpstreamError) {
    return { status: 500, message: error.message };
  }
  return { status: 500, message: "Error: Internal server error." };
};

export const errorResponse = (c: Context, error: unknown) => {
  console.error(error);
  const upstream = upstreamErrorResponse(error);
  if (upstream) {
    return upstream;
  }
  const { status, message } = errorStatusAndMessage(error);
  return c.text(message, status as 400 | 404 | 500);
};
