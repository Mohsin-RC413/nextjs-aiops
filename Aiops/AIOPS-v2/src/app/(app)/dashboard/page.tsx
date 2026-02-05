"use client";

import { AGENT_API_BASE_URL, AGENT_ORG_KEY } from "@/config/agent";
import {
  Bell,
  Bot,
  CheckCircle2,
  Eye,
  Filter,
  MessageCircle,
  Sparkles,
  TriangleAlert,
  X,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const statCards = [
  {
    title: "Total Incidents",
    value: "88",
    icon: TriangleAlert,
    bg: "from-[#ff7a45] to-[#ff4d4f]",
  },
  {
    title: "Resolved Incidents",
    value: "30",
    icon: CheckCircle2,
    bg: "from-[#18c964] to-[#00b56c]",
  },
  {
    title: "Open Incidents",
    value: "58",
    icon: Zap,
    bg: "from-[#2f80ff] to-[#1aa7ff]",
  },
  {
    title: "Total Agents",
    value: "20",
    icon: Bot,
    bg: "from-[#b45cff] to-[#ff5ac8]",
  },
];

type AgentRecord = {
  agentId: number;
  name: string;
  port: number | null;
  status: string;
  enterprise: string;
  start_time: string | null;
  stop_time: string | null;
};

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

const incidents = [
  {
    id: "INC0010095",
    desc: "Mule AI-Agent detected an issue. The application 'warehouse-app05' is currently in 'STOPPED' state.",
    state: "7",
    openedAt: "24/01/2026, 12:44:24",
    active: "false",
    priority: "5",
  },
  {
    id: "INC0010095",
    desc: "Mule AI-Agent detected an issue. The application 'warehouse-app05' is currently in 'STOPPED' state.",
    state: "7",
    openedAt: "24/01/2026, 12:44:24",
    active: "false",
    priority: "5",
  },
  {
    id: "INC0010095",
    desc: "Mule AI-Agent detected an issue. The application 'warehouse-app05' is currently in 'STOPPED' state.",
    state: "7",
    openedAt: "24/01/2026, 12:44:24",
    active: "false",
    priority: "5",
  },
  {
    id: "INC0010095",
    desc: "Mule AI-Agent detected an issue. The application 'warehouse-app05' is currently in 'STOPPED' state.",
    state: "7",
    openedAt: "24/01/2026, 12:44:24",
    active: "false",
    priority: "5",
  },
];

const activityTagStyles: Record<string, string> = {
  success: "bg-[#e6f9ee] text-[#16a34a]",
  warning: "bg-[#fff1e7] text-[#f97316]",
  running: "bg-[#e8f0ff] text-[#2563eb]",
};

export default function DashboardPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [isAgentsLoading, setIsAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    agent: AgentRecord;
    action: "start" | "stop";
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [agentFilter, setAgentFilter] = useState<
    "all" | "running" | "stopped"
  >("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const agentApiBase = AGENT_API_BASE_URL.endsWith("/")
    ? AGENT_API_BASE_URL.slice(0, -1)
    : AGENT_API_BASE_URL;

  const totalAgents = agents.length;
  const filteredAgents = useMemo(() => {
    if (agentFilter === "all") {
      return agents;
    }
    const isRunning = agentFilter === "running";
    return agents.filter((agent) =>
      isRunning
        ? agent.status?.toUpperCase() === "STARTED"
        : agent.status?.toUpperCase() !== "STARTED"
    );
  }, [agents, agentFilter]);

  const loadAgents = async (signal?: AbortSignal) => {
    setIsAgentsLoading(true);
    setAgentsError("");

    try {
      const url = `${agentApiBase}/aiops/agent/list?orgKey=${encodeURIComponent(
        AGENT_ORG_KEY
      )}`;
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        signal,
      });
      const data = await response.json();
      console.log("Dashboard agent list response:", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (response.ok && Array.isArray(data?.agents)) {
        setAgents(data.agents);
      } else {
        setAgentsError(data?.message || "Unable to load agents.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setAgentsError("Unable to load agents.");
    } finally {
      setIsAgentsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadAgents(controller.signal);
    return () => controller.abort();
  }, []);

  const handleConfirmToggle = async () => {
    if (!pendingAction || isUpdating) {
      return;
    }

    const { agent, action } = pendingAction;
    setIsUpdating(true);
    setUpdateError("");

    try {
      const url = `${agentApiBase}/aiops/agent/${action}?agentId=${encodeURIComponent(
        agent.agentId
      )}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { accept: "application/json" },
      });
      const data = await response.json();
      console.log(`Agent ${action} response:`, {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (!response.ok) {
        setUpdateError(
          data?.message || `Unable to ${action} ${agent.name}.`
        );
        return;
      }

      setAgents((prev) =>
        prev.map((item) => {
          if (item.agentId !== agent.agentId) {
            return item;
          }
          if (action === "start") {
            return {
              ...item,
              status: "STARTED",
              port: typeof data?.port === "number" ? data.port : item.port,
            };
          }
          return {
            ...item,
            status: "STOPPED",
            port: null,
          };
        })
      );
      setPendingAction(null);
    } catch (error) {
      setUpdateError(`Unable to ${action} ${agent.name}.`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white px-8 py-7 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_2fr]">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-[#10131a]">
                Welcome back, Alice!
                <span role="img" aria-label="wave">
                  
                </span>
              </h2>
              <p className="mt-2 text-sm text-[#5b6476]">
                Here's what's happening with your infrastructure today
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-[#1d2433]">
                <span>Profile Completion:</span>
                <span className="text-[#5b4cf0]">75%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#e8ebf4]">
                <div className="relative h-2 w-[75%] rounded-full bg-[#5b4cf0]">
                  <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full border-[3px] border-white bg-[#5b4cf0] shadow-[0_4px_12px_rgba(91,76,240,0.35)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl bg-white p-5 shadow-[0_12px_30px_-28px_rgba(16,24,40,0.45)] ring-1 ring-[#eef1f7]"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.bg} text-white shadow-[0_10px_20px_-12px_rgba(0,0,0,0.45)]`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-6 text-sm font-semibold text-[#5a6476]">
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

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1.6fr]">
        <div className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-[#111827]">
                  Agent management
                </h3>
                <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
                  {totalAgents}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#5b6476]">
                Start/stop live actions and inspect recent activity.
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-[#e3e7f2] px-3 py-2 text-sm font-medium text-[#111827] shadow-[0_6px_14px_-12px_rgba(16,24,40,0.3)]"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
              {isFilterOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.3)]">
                  {[
                    { label: "All", value: "all" },
                    { label: "Running", value: "running" },
                    { label: "Stopped", value: "stopped" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setAgentFilter(option.value as "all" | "running" | "stopped");
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm ${
                        agentFilter === option.value
                          ? "bg-[#eef2ff] text-[#4f49e2]"
                          : "text-[#111827] hover:bg-[#f3f4f6]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {agentFilter !== "all" ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e0e5f0] bg-white px-3 py-1 text-xs font-semibold text-[#4f49e2]">
              {agentFilter === "running" ? "Running" : "Stopped"}
              <button
                type="button"
                onClick={() => setAgentFilter("all")}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f49e2]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {isAgentsLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-[#eef1f7] bg-white px-5 py-6 text-sm text-[#647087] shadow-[0_10px_30px_-28px_rgba(16,24,40,0.4)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#ecebff] text-[#5b4cf0]">
                  <Bot className="h-4 w-4" />
                </span>
                Loading agents...
              </div>
            ) : agentsError ? (
              <div className="rounded-2xl border border-[#fee2e2] bg-[#fff5f5] px-5 py-6 text-sm text-[#b91c1c] shadow-[0_10px_30px_-28px_rgba(16,24,40,0.4)]">
                {agentsError}
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="rounded-2xl border border-[#eef1f7] bg-white px-5 py-6 text-sm text-[#647087] shadow-[0_10px_30px_-28px_rgba(16,24,40,0.4)]">
                No agents yet.
              </div>
            ) : (
              filteredAgents.map((agent) => {
                const isRunning = agent.status?.toUpperCase() === "STARTED";
                const runningAt = agent.port
                  ? agent.port.toString()
                  : "Agent Not Started";
                return (
                  <div
                    key={agent.agentId}
                    className="rounded-2xl border border-[#eef1f7] bg-white px-5 py-4 shadow-[0_10px_30px_-28px_rgba(16,24,40,0.4)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ecebff] text-[#5b4cf0]">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">
                            {agent.name}
                          </p>
                          <p className="text-xs text-[#647087]">
                            Running at: {runningAt} - v1.0.0
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#647087]">
                        <span>{isRunning ? "Running" : "Stopped"}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingAction({
                              agent,
                              action: isRunning ? "stop" : "start",
                            })
                          }
                          disabled={isUpdating}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                            isRunning ? "bg-[#5b4cf0]" : "bg-[#e3e6ee]"
                          } ${isUpdating ? "cursor-not-allowed opacity-70" : ""}`}
                        >
                          <span
                            className={`absolute h-4 w-4 rounded-full bg-white shadow transition ${
                              isRunning ? "left-5" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#cfefff] px-4 py-2 text-sm font-medium text-[#0b7ed9]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat with agent
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#e1e5ef] px-4 py-2 text-sm font-medium text-[#3a4355] opacity-60 cursor-not-allowed bg-[#f9fafb]"
                      >
                        View Logs
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-[#4f49e2] py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(79,73,226,0.6)]"
          >
            See All
          </button>
        </div>

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
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-[#111827]">
                Recent closed incidents
              </h3>
              <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
                10
              </span>
            </div>
            <p className="mt-2 text-sm text-[#5b6476]">09/12/2025, 12:39:55</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-[#4f49e2] px-4 py-2 text-xs font-semibold text-white"
            >
              24H
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#e0e5f0] px-4 py-2 text-xs font-semibold text-[#111827]"
            >
              7D
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#e0e5f0] px-4 py-2 text-xs font-semibold text-[#111827]"
            >
              30D
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#eef1f7]">
          <div className="grid grid-cols-[1.1fr_3fr_0.8fr_1.2fr_0.8fr_0.8fr_0.9fr] bg-[#f3f6fb] px-4 py-3 text-xs font-semibold text-[#111827]">
            <span>Incident ID</span>
            <span>Description</span>
            <span>State</span>
            <span>Opened At</span>
            <span>Active</span>
            <span>Priority</span>
            <span></span>
          </div>
          <div className="divide-y divide-[#eef1f7] bg-white">
            {incidents.map((row, index) => (
              <div
                key={`${row.id}-${index}`}
                className="grid grid-cols-[1.1fr_3fr_0.8fr_1.2fr_0.8fr_0.8fr_0.9fr] items-center px-4 py-4 text-sm text-[#2b3341]"
              >
                <span className="font-semibold text-[#1c2330]">{row.id}</span>
                <span>{row.desc}</span>
                <span>{row.state}</span>
                <span>{row.openedAt}</span>
                <span>{row.active}</span>
                <span>{row.priority}</span>
                <button
                  type="button"
                  className="ml-auto rounded-lg bg-[#4f49e2] px-4 py-2 text-xs font-semibold text-white"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between border-b border-[#eef1f7] px-6 py-4">
              <h4 className="text-lg font-semibold text-[#111827]">
                {pendingAction.action === "start" ? "Start Agent" : "Stop Agent"}
              </h4>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#374151]">
                Are you sure you want to {" "}
                {pendingAction.action === "start" ? "start" : "stop"}{" "}
                <span className="font-semibold text-[#111827]">
                  {pendingAction.agent.name}
                </span>
                ?
              </p>
              {updateError ? (
                <p className="mt-3 text-sm text-[#dc2626]">{updateError}</p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#eef1f7] px-6 py-4">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="rounded-xl border border-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#374151]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                disabled={isUpdating}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white ${
                  isUpdating
                    ? "cursor-not-allowed bg-[#c7c4f7]"
                    : "bg-[#4f49e2] shadow-[0_10px_24px_-18px_rgba(79,73,226,0.9)] hover:bg-[#433ccf]"
                }`}
              >
                {isUpdating
                  ? pendingAction.action === "start"
                    ? "Starting..."
                    : "Stopping..."
                  : pendingAction.action === "start"
                    ? "Start"
                    : "Stop"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
