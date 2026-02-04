'use client';

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors theme="system" />
    </ThemeProvider>
  );
}

