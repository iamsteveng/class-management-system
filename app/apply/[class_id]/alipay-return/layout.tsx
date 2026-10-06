import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "正在確認付款",
};

export default function AlipayReturnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
