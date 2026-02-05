"use client";

import { Bot, Edit3, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type AgentRecord = {
  agentId: number;
  name: string;
  port: number | null;
  status: string;
  enterprise: string;
  start_time: string | null;
  stop_time: string | null;
};
type AgentRegistryProps = {
  agents: AgentRecord[];
  isLoading: boolean;
  loadError: string;
};

export default function AgentRegistry({
  agents,
  isLoading,
  loadError,
}: AgentRegistryProps) {
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredAgents = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const statusFiltered = filter === "all"
      ? agents
      : agents.filter((agent) =>
          filter === "online"
            ? agent.status?.toUpperCase() === "STARTED"
            : agent.status?.toUpperCase() !== "STARTED"
        );
    if (!normalizedSearch) {
      return statusFiltered;
    }
    return statusFiltered.filter((agent) =>
      agent.name?.toLowerCase().includes(normalizedSearch)
    );
  }, [agents, filter, searchValue]);

  const agentCount = agents.length;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[#111827]">
            Agent Registry
          </h3>
          <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
            {agentCount}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-xl bg-[#eef2ff] px-4 py-2 text-sm text-[#4f49e2] transition-all duration-200 ${
              isSearchFocused ? "w-64" : "w-44"
            }`}
          >
            <Search className="h-4 w-4" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search Agents.."
              className="w-full bg-transparent text-sm text-[#4f49e2] placeholder:text-[#4f49e2] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                filter === "all"
                  ? "bg-[#4f49e2] text-white"
                  : "border border-[#e0e5f0] text-[#111827]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("online")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                filter === "online"
                  ? "bg-[#4f49e2] text-white"
                  : "border border-[#e0e5f0] text-[#111827]"
              }`}
            >
              Online
            </button>
            <button
              type="button"
              onClick={() => setFilter("offline")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                filter === "offline"
                  ? "bg-[#4f49e2] text-white"
                  : "border border-[#e0e5f0] text-[#111827]"
              }`}
            >
              Offline
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#eef1f7]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2] shadow-[0_12px_24px_-20px_rgba(79,73,226,0.8)]">
              <Bot className="h-6 w-6" />
            </div>
            <p className="text-sm text-[#6b7280]">Loading agents...</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fee2e2] text-[#ef4444] shadow-[0_12px_24px_-20px_rgba(239,68,68,0.55)]">
              <Bot className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[#111827]">
              Unable to load agents
            </p>
            <p className="text-sm text-[#6b7280]">{loadError}</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2] shadow-[0_12px_24px_-20px_rgba(79,73,226,0.8)]">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-[#111827]">
                {agents.length === 0 && filter === "all"
                  ? "No agents yet"
                  : filter === "online"
                    ? "No Online agents yet"
                    : filter === "offline"
                      ? "No Offline agents yet"
                      : "No agents found"}
              </p>
              {agents.length === 0 && filter === "all" ? (
                <p className="text-sm text-[#6b7280]">
                  Create one to start monitoring and automating tasks.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <>
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
              {filteredAgents.map((agent, index) => {
                const isOnline = agent.status?.toUpperCase() === "STARTED";
                const runningAt = agent.port
                  ? agent.port.toString()
                  : "Agent Not Started";
                const modified = agent.start_time
                  ? `Started at ${agent.start_time}`
                  : "Not started";
                return (
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
                  <span>Agent</span>
                  <span>{modified}</span>
                  <span>{runningAt}</span>
                  <span
                    className={`flex items-center gap-2 ${
                      isOnline ? "text-[#1f7a1f]" : "text-[#b45309]"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isOnline ? "bg-[#16a34a]" : "bg-[#f59e0b]"
                      }`}
                    />
                    {isOnline ? "Online" : "Offline"}
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
              );
            })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
