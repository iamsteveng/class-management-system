import {
  actionGeneric,
  mutationGeneric,
  queryGeneric,
  type GenericActionCtx,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v, type ObjectType, type PropertyValidators, type Validator } from "convex/values";

import type { DataModel } from "./_generated/dataModel";

/**
 * Functions only our Next.js server may call (ADR 0003): admin functions, checkout, and
 * test helpers. Each takes the server secret, which only the server holds, and refuses
 * the call without it, or when no secret is configured at all.
 */

export function assertServerSecret(secret: string) {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Not allowed.");
  }
}

const secretArg = { server_secret: v.string() };

type Definition<Ctx, Args extends PropertyValidators, Result> = {
  args: Args;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  returns?: Validator<any, any, any>;
  handler: (ctx: Ctx, args: ObjectType<Args>) => Result | Promise<Result>;
};

function guarded<Ctx, Args extends PropertyValidators, Result>(def: Definition<Ctx, Args, Result>) {
  return {
    args: { ...def.args, ...secretArg },
    ...(def.returns ? { returns: def.returns } : {}),
    handler: async (ctx: Ctx, args: ObjectType<Args> & { server_secret: string }) => {
      const { server_secret, ...rest } = args;
      assertServerSecret(server_secret);
      return def.handler(ctx, rest as unknown as ObjectType<Args>);
    },
  };
}

export function serverQuery<Args extends PropertyValidators, Result>(
  def: Definition<GenericQueryCtx<DataModel>, Args, Result>
) {
  return queryGeneric(guarded(def) as unknown as Parameters<typeof queryGeneric>[0]);
}

export function serverMutation<Args extends PropertyValidators, Result>(
  def: Definition<GenericMutationCtx<DataModel>, Args, Result>
) {
  return mutationGeneric(guarded(def) as unknown as Parameters<typeof mutationGeneric>[0]);
}

export function serverAction<Args extends PropertyValidators, Result>(
  def: Definition<GenericActionCtx<DataModel>, Args, Result>
) {
  return actionGeneric(guarded(def) as unknown as Parameters<typeof actionGeneric>[0]);
}
