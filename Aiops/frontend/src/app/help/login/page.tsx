import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function LoginHelpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-10 text-[var(--text)]">
      <Card className="w-full max-w-xl space-y-4 border border-[var(--border)] bg-[var(--surface)]/90 p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Login help</p>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Trouble signing in?</h1>
        <p className="text-sm text-[var(--muted)]">
          Contact your team administrator to reset your password or confirm your role permissions.
        </p>
        <Link href="/login" className="text-sm font-semibold text-[#2563eb] transition hover:text-[#1d4ed8]">
          Back to login
        </Link>
      </Card>
    </div>
  );
}

