import { Edit3, Search, Trash2 } from "lucide-react";

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

export default function AgentRegistry() {
  return (
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
  );
}
