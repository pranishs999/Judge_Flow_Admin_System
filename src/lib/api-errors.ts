import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

export function badRequest(message: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    { error: message, code: "BAD_REQUEST", details } satisfies ApiError,
    { status: 400 },
  );
}

export function unauthorized(message = "Invalid or expired token") {
  return NextResponse.json(
    { error: message, code: "UNAUTHORIZED" } satisfies ApiError,
    { status: 401 },
  );
}

export function forbidden(message = "Insufficient permissions") {
  return NextResponse.json(
    { error: message, code: "FORBIDDEN" } satisfies ApiError,
    { status: 403 },
  );
}

export function notFound(message = "Resource does not exist") {
  return NextResponse.json(
    { error: message, code: "NOT_FOUND" } satisfies ApiError,
    { status: 404 },
  );
}

export function conflict(message: string) {
  return NextResponse.json(
    { error: message, code: "CONFLICT" } satisfies ApiError,
    { status: 409 },
  );
}

export function unprocessable(message: string) {
  return NextResponse.json(
    { error: message, code: "UNPROCESSABLE_ENTITY" } satisfies ApiError,
    { status: 422 },
  );
}

export function internalError(message = "Internal server error") {
  return NextResponse.json(
    { error: message, code: "INTERNAL_SERVER_ERROR" } satisfies ApiError,
    { status: 500 },
  );
}
