import { Bell, Sparkles } from "lucide-react";

const activityLog = [
  {
    title: "AIOps Agent Started",
    detail: "I'm up and running. Mule login completed successfully.",
    tag: "success",
  },
  {
    title: "Awaiting Agent Start",
    detail:
      "I don't see any rules assigned to me yet. I'll stay idle and keep checking periodically.",
    tag: "warning",
  },
  {
    title: "System Health Check",
    detail:
      "I'm going to sleep for 15 seconds (about 1 minutes). I'll check again.",
    tag: "warning",
  },
  {
    title: "Update Check",
    detail:
      "The application 'warehouse-app05' is running normally (status: RUNNING).",
    tag: "running",
  },
];

const activityTagStyles: Record<string, string> = {
  success: "bg-[#e6f9ee] text-[#16a34a]",
  warning: "bg-[#fff1e7] text-[#f97316]",
  running: "bg-[#e8f0ff] text-[#2563eb]",
};

export default function AgentActivityLog() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
      <div>
        <h3 className="text-lg font-semibold text-[#111827]">
          Agent Activity Log
        </h3>
        <p className="mt-1 text-sm text-[#5b6476]">
          Streaming from Mule Agent 21126 (running at 58210)
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {activityLog.map((entry) => (
          <div key={entry.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#ecebff] text-[#5b4cf0]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="mt-2 h-full w-px bg-[#e6eaf3]" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {entry.title}
                  </p>
                  <p className="mt-1 text-sm text-[#5f677a]">
                    {entry.detail}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#8a94a6]">
                  <Bell className="h-3.5 w-3.5" />
                  2 min ago
                </div>
              </div>
              <span
                className={`mt-3 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  activityTagStyles[entry.tag]
                }`}
              >
                {entry.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
