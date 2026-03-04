import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { getServerAuthSession } from "@/lib/auth";

type SearchParamValue = string | string[] | undefined;

type AdminLoginPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const session = await getServerAuthSession();
  if (session?.user?.username) {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const errorMessage = readSingleQueryParam(params.error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Admin Login</h1>
        <p className="mt-2 text-sm text-zinc-700">Sign in to access the management portal.</p>
        <LoginForm initialError={errorMessage} />
      </section>
    </main>
  );
}

function readSingleQueryParam(value: SearchParamValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}
