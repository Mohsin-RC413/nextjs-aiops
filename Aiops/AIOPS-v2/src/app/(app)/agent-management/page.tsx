"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import AgentRegistry from "./AgentRegistry";
import AgentStats from "./AgentStats";
import CreateNewAgent from "./createnewagent";
import { AGENT_API_BASE_URL, AGENT_ORG_KEY } from "@/config/agent";

type AgentRecord = {
  agentId: number;
  name: string;
  port: number | null;
  status: string;
  enterprise: string;
  start_time: string | null;
  stop_time: string | null;
};

const AGENT_API_BASE = AGENT_API_BASE_URL.endsWith("/")
  ? AGENT_API_BASE_URL.slice(0, -1)
  : AGENT_API_BASE_URL;
const AGENT_LIST_URL = `${AGENT_API_BASE}/aiops/agent/list`;

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAgents = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");

    try {
      const url = `${AGENT_LIST_URL}?orgKey=${encodeURIComponent(
        AGENT_ORG_KEY
      )}`;
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        signal,
      });
      const data = await response.json();
      console.log("Agent list response:", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (response.ok && Array.isArray(data?.agents)) {
        setAgents(data.agents);
      } else {
        setLoadError(data?.message || "Unable to load agents.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setLoadError("Unable to load agents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadAgents(controller.signal);
    return () => controller.abort();
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    await loadAgents();
    setIsRefreshing(false);
  };

  const { onlineCount, offlineCount, totalCount } = useMemo(() => {
    const total = agents.length;
    const online = agents.filter(
      (agent) => agent.status?.toUpperCase() === "STARTED"
    ).length;
    const offline = total - online;
    return { onlineCount: online, offlineCount: offline, totalCount: total };
  }, [agents]);

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
            <CreateNewAgent onCreateSuccess={() => loadAgents()} />
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f2] bg-white px-4 py-2 text-sm font-semibold text-[#4f49e2] shadow-[0_10px_20px_-16px_rgba(79,73,226,0.5)] transition hover:bg-[#eef2ff] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh Agents
              </button>
            </div>
            <AgentStats
              onlineCount={onlineCount}
              offlineCount={offlineCount}
              totalCount={totalCount}
              isLoading={isLoading || isRefreshing}
            />
          </div>
        </div>
      </section>

      <AgentRegistry
        agents={agents}
        isLoading={isLoading}
        loadError={loadError}
        onDeleteSuccess={() => loadAgents()}
      />
    </div>
  );
}
