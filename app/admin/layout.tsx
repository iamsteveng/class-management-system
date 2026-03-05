import type { ReactNode } from "react";

import { AdminNav } from "./admin-nav";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
