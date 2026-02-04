'use client';

import { AuthGate } from "@/components/auth/AuthGate";
import { RequireRole } from "@/components/auth/RequireRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AgentSummary, useAgents } from "@/lib/useAgents";
import { Bot, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AgentSettingsModal } from "./AgentSettingsModal";
import { CreateAgent } from "./CreateAgent";

export default function AgentManagementPage() {
  const { agents, performAgentAction, addAgent, deleteAgent } = useAgents();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [sortBy, setSortBy] = useState<"name" | "type" | "lastModified" | "port" | "status">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const filteredAgents = useMemo(
    () =>
      agents.filter((agent) => {
        const matchesSearch = agent.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
        const matchesStatus =
          statusFilter === "all" ? true : statusFilter === "online" ? agent.running : !agent.running;
        return matchesSearch && matchesStatus;
      }),
    [agents, searchTerm, statusFilter],
  );
  const totalAgents = agents.length;
  const onlineAgents = useMemo(() => agents.filter((a) => a.running).length, [agents]);
  const offlineAgents = Math.max(0, totalAgents - onlineAgents);
  const getAgentDisplayTime = (agent: AgentSummary) => {
    if (agent.running) return agent.startTime ?? agent.lastActionTime ?? agent.createdAt ?? "";
    if (agent.stopTime) return agent.stopTime;
    return agent.createdAt ?? agent.lastActionTime ?? "";
  };
  const agentPieGradient = useMemo(() => {
    const onlineColor = "#34d399";
    const offlineColor = "#d1d5db";
    if (!totalAgents) return `conic-gradient(${offlineColor} 0% 100%)`;
    const onlinePercent = Math.round((onlineAgents / totalAgents) * 100);
    if (onlinePercent <= 0) {
      return `conic-gradient(${offlineColor} 0% 100%)`;
    }
    if (onlinePercent >= 100) {
      return `conic-gradient(${onlineColor} 0% 100%)`;
    }
    return `conic-gradient(${onlineColor} 0% ${onlinePercent}%, ${offlineColor} ${onlinePercent}% 100%)`;
  }, [onlineAgents, totalAgents]);
  const sortedAgents = useMemo(() => {
    const copy = [...filteredAgents];
    const directionFactor = sortDirection === "asc" ? 1 : -1;
    const getSortValue = (agent: (typeof filteredAgents)[number]) => {
      switch (sortBy) {
        case "name":
          return agent.name.toLowerCase();
        case "type":
          return (agent.type || "agent").toLowerCase();
        case "status":
          return agent.running ? 1 : 0;
        case "port":
          return agent.running && agent.port ? agent.port : Number.MAX_SAFE_INTEGER;
        case "lastModified": {
          const ts = new Date(getAgentDisplayTime(agent)).getTime();
          return Number.isFinite(ts) ? ts : 0;
        }
        default:
          return agent.name.toLowerCase();
      }
    };
    copy.sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * directionFactor;
      }
      return String(av).localeCompare(String(bv)) * directionFactor;
    });
    return copy;
  }, [filteredAgents, sortBy, sortDirection]);
  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };
  const totalPages = Math.max(1, Math.ceil(sortedAgents.length / pageSize));
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAgents.slice(start, start + pageSize);
  }, [currentPage, sortedAgents]);
  const paginatedAgentIds = useMemo(
    () =>
      paginatedAgents
        .filter((agent) => agent.deletable !== false)
        .map((agent) => agent.agentId)
        .filter((id): id is number => typeof id === "number"),
    [paginatedAgents],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setSelectedAgentIds((prev) =>
      prev.filter((id) => agents.some((agent) => agent.agentId === id && agent.deletable !== false)),
    );
  }, [agents]);

  const selectedAgents = useMemo(
    () => agents.filter((agent) => agent.deletable !== false && selectedAgentIds.includes(agent.agentId)),
    [agents, selectedAgentIds],
  );

  const [confirmAction, setConfirmAction] = useState<{
    agentName: string;
    type: "start" | "stop";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentSummary | null>(null);

  const toggleAgent = (agentName: string, type: "start" | "stop") => {
    setConfirmAction({ agentName, type });
  };

  const handleConfirmToggle = async () => {
    if (!confirmAction) return;
    const target = agents.find((agent) => agent.name === confirmAction.agentName);
    if (!target?.agentId) {
      setConfirmAction(null);
      return;
    }
    await performAgentAction(target.agentId, confirmAction.type);
    setConfirmAction(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAgent(deleteTarget.agentId);
    } catch (err) {
      // Error is logged inside deleteAgent
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    const deletableAgents = selectedAgents.filter(
      (agent) => agent.deletable !== false && !agent.running && agent.agentId,
    );
    for (const agent of deletableAgents) {
      try {
        await deleteAgent(agent.agentId);
      } catch (err) {
        // individual delete failures are surfaced by deleteAgent
      }
    }
    setSelectedAgentIds((prev) =>
      prev.filter((id) => !deletableAgents.some((agent) => agent.agentId === id)),
    );
  };

  const toggleSelectAllOnPage = () => {
    const allSelected = paginatedAgentIds.every((id) => selectedAgentIds.includes(id));
    if (allSelected) {
      setSelectedAgentIds((prev) => prev.filter((id) => !paginatedAgentIds.includes(id)));
    } else {
      setSelectedAgentIds((prev) => [...prev, ...paginatedAgentIds.filter((id) => !prev.includes(id))]);
    }
  };

  const toggleSelectAgent = (agentId?: number) => {
    if (typeof agentId !== "number") return;
    const target = agents.find((agent) => agent.agentId === agentId);
    if (!target || target.deletable === false) return;
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    );
  };

  return (
    <AuthGate>
      <RequireRole roles={["admin", "operator"]}>
        <section className="space-y-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="min-w-[240px]">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-slate-300" aria-hidden="true" />
                <p className="section-title">Agent management</p>
              </div>
              <p className="text-sm text-white/60">Lifecycle, versioning, and health of deployed agents.</p>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg border border-slate-200/80 bg-white/80 px-9 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_6px_20px_rgba(15,23,42,0.05)] focus:border-slate-400 focus:outline-none"
                  placeholder="Search Agent"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
            <CreateAgent addAgent={addAgent} />

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex flex-col gap-2 border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-white/70" aria-hidden="true" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Total agents</p>
              </div>
              <p className="text-2xl font-semibold">{totalAgents}</p>
              <p className="text-xs text-emerald-200">+2 new this week</p>
            </Card>
            <Card className="flex flex-col gap-2 border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Online</p>
              </div>
              <p className="text-2xl font-semibold">{onlineAgents}</p>
              <p className="text-xs text-emerald-200">All healthy</p>
            </Card>
            <Card className="flex flex-col gap-2 border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Offline</p>
              </div>
              <p className="text-2xl font-semibold">{offlineAgents}</p>
              <p className="text-xs text-rose-200">Review connectivity</p>
            </Card>
            <Card className="flex flex-col gap-3 border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Agent</p>
                    <Bot className="h-4 w-4 text-white/70" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-semibold">{totalAgents} total</p>
                </div>
                {totalAgents > 0 ? (
                  <div className="relative h-20 w-20">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundImage: agentPieGradient }}
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-24 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
                    No agents
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <span className="text-white/80">Online</span>
                  <span className="ml-auto font-semibold text-emerald-200">{onlineAgents}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="text-white/80">Offline</span>
                  <span className="ml-auto font-semibold text-slate-200">{offlineAgents}</span>
                </div>
              </div>
            </Card>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Filter</span>
              {(["all", "online", "offline"] as const).map((option) => {
                const isActive = statusFilter === option;
                const labels: Record<typeof option, string> = { all: "All", online: "Online", offline: "Offline" };
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatusFilter(option)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 transition ${
                      isActive
                        ? "border border-slate-400 bg-slate-200 text-slate-900 shadow-[0_4px_10px_rgba(15,23,42,0.08)]"
                        : "border border-black bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                    aria-pressed={isActive}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        option === "online" ? "bg-emerald-500" : option === "offline" ? "bg-slate-500" : "bg-slate-700"
                      }`}
                    />
                    {labels[option]}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">
                {selectedAgents.length} selected
                {selectedAgents.some((agent) => agent.running) && (
                  <span className="text-xs text-amber-600"> (online agents cannot be deleted)</span>
                )}
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={
                  selectedAgents.length === 0 || selectedAgents.some((agent) => agent.running) || paginatedAgentIds.length === 0
                }
                className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-red-500 px-3 py-2 text-sm font-medium text-white shadow-[0_10px_24px_rgba(244,67,54,0.25)] transition enabled:hover:bg-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
              >
                <Trash2 className="h-4 w-4" />
                Delete selected
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <span className="h-px flex-1 min-w-[96px] bg-slate-300/70" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-slate-600" aria-hidden="true" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">Agent Registry</p>
            </div>
            <span className="h-px flex-1 min-w-[96px] bg-slate-300/70" aria-hidden="true" />
          </div>
          <Card className="overflow-hidden border border-slate-200/80 bg-white/90 text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.08)] mt-2">
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 align-middle">
                    <th className="w-12 px-4 py-3 text-left align-middle">
                      <input
                        type="checkbox"
                        checked={paginatedAgentIds.length > 0 && paginatedAgentIds.every((id) => selectedAgentIds.includes(id))}
                        onChange={toggleSelectAllOnPage}
                        aria-label="Select all agents on this page"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left align-middle">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-slate-600"
                        onClick={() => toggleSort("name")}
                      >
                        Name {sortBy === "name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center align-middle">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 text-slate-600"
                        onClick={() => toggleSort("type")}
                      >
                        Type {sortBy === "type" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center align-middle">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 text-slate-600"
                        onClick={() => toggleSort("lastModified")}
                      >
                        Last Modified {sortBy === "lastModified" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center align-middle">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 text-slate-600"
                        onClick={() => toggleSort("port")}
                      >
                        Running at {sortBy === "port" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center align-middle">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 text-slate-600"
                        onClick={() => toggleSort("status")}
                      >
                        Status {sortBy === "status" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right align-middle">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-slate-800">
                  {paginatedAgents.map((agent) => {
                    const statusLabel = agent.running ? "Online" : "Offline";
                    const portLabel = agent.running && agent.port ? agent.port : "Agent Not Started";
                    const isSelected = agent.agentId ? selectedAgentIds.includes(agent.agentId) : false;
                    const isDeletable = agent.deletable !== false;
                    return (
                      <tr key={agent.name} className="bg-white/85 transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 disabled:cursor-not-allowed disabled:border-slate-200"
                            checked={isSelected}
                            disabled={!isDeletable}
                            onChange={() => toggleSelectAgent(agent.agentId)}
                            aria-label={`Select ${agent.name}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 uppercase">
                              {agent.name.slice(0, 2)}
                            </span>
                            <span className="font-semibold text-slate-900">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700">{agent.type || "Agent"}</td>
                        <td className="px-4 py-3 text-center text-slate-700">
                          {(() => {
                            const started = agent.running;
                            const time = started
                              ? agent.startTime ?? agent.lastActionTime
                              : agent.stopTime ?? agent.lastActionTime ?? agent.createdAt ?? "N/A";
                            const label = started ? "Started at " : agent.stopTime ? "Stopped at " : "Created at ";
                            return `${label}${time ?? "N/A"}`;
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700">{portLabel}</td>
                        <td className="px-4 py-3 text-center text-slate-700">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                agent.running ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            />
                            <span>{statusLabel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <AgentSettingsModal agent={agent} />
                            {agent.deletable !== false && (
                              <button
                                type="button"
                                className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-white shadow-[0_6px_14px_rgba(244,67,54,0.25)] transition ${
                                  agent.running
                                    ? "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none"
                                    : "bg-red-500 hover:bg-red-600"
                                }`}
                                disabled={agent.running}
                                aria-label={`Delete ${agent.name}`}
                                title="Delete"
                                onClick={() => {
                                  if (agent.running) return;
                                  setDeleteTarget(agent);
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a1 1 0 00-1 1h-4a1 1 0 00-1 1v2m-3 0h12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAgents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                        No agents match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/80 bg-white/90 px-4 py-4 text-sm text-slate-700">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                  currentPage === 1
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] rounded-full px-3 py-1 transition shadow-sm border ${
                      isActive
                        ? "border-slate-900 bg-slate-50 text-slate-900 font-bold shadow-[0_8px_22px_rgba(15,23,42,0.15)]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                  currentPage === totalPages
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Next →
              </button>
            </div>
          </Card>
        </section>

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-[28px] border border-rose-200/60 bg-white/95 p-6 shadow-[0_25px_45px_rgba(15,23,42,0.35)]">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-rose-500">Delete agent</p>
                <h3 className="text-2xl font-semibold text-slate-900">Confirm deletion</h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This action
                  will remove the agent and stop its activities.
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-[28px] border border-white/30 bg-white/95 p-6 shadow-[0_25px_45px_rgba(15,23,42,0.35)]">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Confirm action</p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {confirmAction.type === "start" ? "Start" : "Stop"}
                </h3>
                <p className="text-sm text-slate-600">
                  {confirmAction.type === "start"
                    ? "You are about to start the agent, which will initiate background processes."
                    : "Stopping the agent will suspend its integrations until next restart."}
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleConfirmToggle}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </RequireRole>
    </AuthGate>
  );
}


