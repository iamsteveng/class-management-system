const CONVEX_URL = "https://graceful-mole-393.convex.cloud";

type ConvexSuccess<T> = {
  status: "success";
  value: T;
};

type ConvexFailure = {
  status: "error";
  errorMessage?: string;
};

type ConvexResponse<T> = ConvexSuccess<T> | ConvexFailure;

async function convexCall<T>(
  kind: "query" | "mutation" | "action",
  path: string,
  args: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path,
      args,
      format: "json",
    }),
  });

  const payload = (await response.json()) as ConvexResponse<T>;
  if (payload.status !== "success") {
    throw new Error(
      `${kind} ${path} failed: ${payload.errorMessage ?? "unknown error"}`
    );
  }

  return payload.value;
}

export function convexMutation<T>(
  path: string,
  args: Record<string, unknown>
): Promise<T> {
  return convexCall<T>("mutation", path, args);
}

export async function seedInitialData() {
  await convexMutation("seed:seedInitialData", {});
}
