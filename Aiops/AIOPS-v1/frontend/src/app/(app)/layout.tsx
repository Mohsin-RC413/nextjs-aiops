import type { ReactNode } from "react";
import AppClientLayout from "./client-layout";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppClientLayout>{children}</AppClientLayout>;
}
