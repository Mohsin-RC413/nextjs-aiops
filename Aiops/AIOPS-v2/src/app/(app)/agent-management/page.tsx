import {
  Bot,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";

const statCards = [
  {
    title: "Online",
    value: "30",
    note: "All healthy",
    icon: CheckCircle2,
    tone: "from-[#18c964] to-[#00b56c]",
    noteColor: "text-[#16a34a]",
  },
  {
    title: "Offline",
    value: "58",
    note: "Review connectivity",
    icon: Zap,
    tone: "from-[#2f80ff] to-[#1aa7ff]",
    noteColor: "text-[#3b82f6]",
  },
  {
    title: "Total Agents",
    value: "20",
    note: "+2 new this week",
    icon: Bot,
    tone: "from-[#b45cff] to-[#ff5ac8]",
    noteColor: "text-[#e11d8d]",
  },
];

const agents = [
  {
    name: "ServiceNow 22126",
    type: "Agent",
    modified: "Started at 2026-01-23T17:59:21",
    runningAt: "Agent Not Started",
    status: "Online",
  },
  {
    name: "AIOps agent",
    type: "Agent",
    modified: "Started at 2026-01-23T17:59:21",
    runningAt: "6515I",
    status: "Online",
  },
];

export default function AgentManagementPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white px-8 py-7 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                Agent management
              </h2>
              <p className="mt-2 text-sm text-[#5b6476]">
                Lifecycle, versioning, and health of deployed agents.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4f49e2] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(79,73,226,0.6)]"
            >
              <Plus className="h-4 w-4" />
              Create Agent
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="min-w-[220px] rounded-2xl bg-white p-5 shadow-[0_12px_30px_-28px_rgba(16,24,40,0.45)] ring-1 ring-[#eef1f7]"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-[0_10px_20px_-12px_rgba(0,0,0,0.45)]`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-semibold ${card.noteColor}`}>
                      {card.note}
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-semibold text-[#5a6476]">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#0f1115]">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[#111827]">
              Agent Registry
            </h3>
            <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
              10
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-[#eef2ff] px-4 py-2 text-sm text-[#4f49e2]">
              <Search className="h-4 w-4" />
              Search here..
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-[#4f49e2] px-4 py-2 text-xs font-semibold text-white"
              >
                All
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#e0e5f0] px-4 py-2 text-xs font-semibold text-[#111827]"
              >
                Online
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#e0e5f0] px-4 py-2 text-xs font-semibold text-[#111827]"
              >
                Offline
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#eef1f7]">
          <div className="grid grid-cols-[0.4fr_1.4fr_1fr_2fr_1.3fr_1fr_0.8fr] bg-[#f3f6fb] px-4 py-3 text-xs font-semibold text-[#111827]">
            <span>
              <input type="checkbox" className="h-4 w-4 rounded" />
            </span>
            <span>Name</span>
            <span>Type</span>
            <span>Last modification</span>
            <span>Running at</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          <div className="divide-y divide-[#eef1f7] bg-white">
            {agents.map((agent, index) => (
              <div
                key={`${agent.name}-${index}`}
                className="grid grid-cols-[0.4fr_1.4fr_1fr_2fr_1.3fr_1fr_0.8fr] items-center px-4 py-4 text-sm text-[#2b3341]"
              >
                <span>
                  <input type="checkbox" className="h-4 w-4 rounded" />
                </span>
                <span className="font-semibold text-[#1c2330]">
                  {agent.name}
                </span>
                <span>{agent.type}</span>
                <span>{agent.modified}</span>
                <span>{agent.runningAt}</span>
                <span className="flex items-center gap-2 text-[#1f7a1f]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
                  {agent.status}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e5e7eb] text-[#111827]"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffe4e6] text-[#ef4444]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
