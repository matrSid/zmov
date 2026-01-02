import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "user - povertymovie",
};

export default function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}