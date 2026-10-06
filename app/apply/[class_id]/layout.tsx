import type { Metadata } from "next";

export const metadata: Metadata = {
  // A nested title stops the root template from reaching child segments, so restate it.
  title: {
    default: "報名及付款",
    template: "%s | 樂區單車安全教室",
  },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
