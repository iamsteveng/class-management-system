import { ConvexHttpClient } from "convex/browser";
import {
  getFunctionName,
  type FunctionArgs,
  type FunctionReference,
  type FunctionReturnType,
} from "convex/server";

import { SERVER_ONLY_FUNCTIONS } from "./serverOnlyFunctions";

/**
 * The server's Convex client. Calls to server-only functions (ADR 0003) carry the server
 * secret automatically; it is read from the server's environment and never reaches the
 * browser. Only import this from server code.
 */
export function createConvexHttpClient() {
  const client = new ConvexHttpClient(resolveConvexDeploymentUrl(), { logger: false });

  const withSecret = <F extends FunctionReference<"query" | "mutation" | "action">>(
    ref: F,
    args: FunctionArgs<F> | undefined
  ): FunctionArgs<F> => {
    const plain = (args ?? {}) as FunctionArgs<F>;
    if (!SERVER_ONLY_FUNCTIONS.has(getFunctionName(ref))) return plain;
    return { ...plain, server_secret: convexServerSecret() } as FunctionArgs<F>;
  };

  return {
    query: <F extends FunctionReference<"query">>(ref: F, args?: FunctionArgs<F>): Promise<FunctionReturnType<F>> =>
      client.query(ref, withSecret(ref, args)),
    mutation: <F extends FunctionReference<"mutation">>(ref: F, args?: FunctionArgs<F>): Promise<FunctionReturnType<F>> =>
      client.mutation(ref, withSecret(ref, args)),
    action: <F extends FunctionReference<"action">>(ref: F, args?: FunctionArgs<F>): Promise<FunctionReturnType<F>> =>
      client.action(ref, withSecret(ref, args)),
  };
}

export function convexServerSecret(): string {
  const secret = process.env.CONVEX_SERVER_SECRET;
  if (!secret) throw new Error("CONVEX_SERVER_SECRET is not configured.");
  return secret;
}

function resolveConvexDeploymentUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_URL ??
    process.env.NEXT_CONVEX_URL;

  if (!fromEnv) {
    throw new Error(
      "Missing Convex URL. Set NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) to your deployment URL."
    );
  }

  return fromEnv.trim().replace(/\/+$/, "");
}
