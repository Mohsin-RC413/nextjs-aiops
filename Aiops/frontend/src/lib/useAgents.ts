'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { AGENT_ORG_KEY } from "@/config/agent";
import { AGENT_API_BASE } from "@/config/api";

const AGENT_LIST_URL = `${AGENT_API_BASE}/list?orgKey=${AGENT_ORG_KEY}`;
const AGENT_ACTION_BASE = AGENT_API_BASE;

export type AgentSummary = {
  agentId: number;
  name: string;
  zone: string;
  status: "healthy" | "warning";
  running: boolean;
  type: string;
  enterprise?: string | null;
  version?: string;
  lastActionTime: string;
  port?: number | null;
  startTime?: string | null;
  stopTime?: string | null;
  createdAt?: string | null;
  deletable?: boolean;
};

type AgentApiItem = {
  agentId: number;
  name: string;
  zone?: string;
  status?: string;
  subType?: string;
  enterprise?: string;
  agentType?: string;
  type?: string;
  version?: string;
  port?: number;
  agent_port?: number;
  agentPort?: number;
  start_time?: string | null;
  stop_time?: string | null;
  created_at?: string | null;
};

export const formatCurrentTime = () => {
  const now = new Date();
  return now.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const toAgentSummary = (agent: AgentApiItem): AgentSummary => {
  const running = agent.status === "RUNNING" || agent.status === "STARTED";
  const startTime = agent.start_time ?? null;
  const stopTime = agent.stop_time ?? null;
  const createdAt = agent.created_at ?? null;
  const lastActionTime = running
    ? startTime ?? formatCurrentTime()
    : stopTime ?? createdAt ?? formatCurrentTime();
  const resolvedPort = agent.port ?? agent.agent_port ?? agent.agentPort ?? null;
  return {
    agentId: agent.agentId,
    name: agent.name ?? "Unknown agent",
    zone: agent.zone ?? "N/A",
    status: running ? "healthy" : "warning",
    running,
    type: agent.subType ?? agent.agentType ?? agent.type ?? "Agent",
    enterprise: agent.enterprise ?? agent.subType ?? null,
    version: agent.version ?? "v1.0.0",
    lastActionTime,
    port: resolvedPort,
    startTime,
    stopTime,
    createdAt,
    deletable: true,
  };
};

export const useAgents = () => {
  const protectedAgents = useMemo<AgentSummary[]>(() => {
    const now = formatCurrentTime();
    return [
      {
        agentId: 999001,
        name: "AIOps agent",
        zone: "AWS",
        status: "healthy",
        running: true,
        type: "Agent",
        enterprise: "AWS",
        version: "v1.0.0",
        lastActionTime: now,
        port: null,
        startTime: now,
        stopTime: null,
        createdAt: now,
        deletable: false,
      },
    ];
  }, []);

  const ensureProtectedAgents = useCallback(
    (incoming: AgentSummary[]): AgentSummary[] => {
      const existingNames = new Set(incoming.map((agent) => agent.name.toLowerCase()));
      const existingIds = new Set(incoming.map((agent) => agent.agentId));
      const missingProtected = protectedAgents
        .filter((agent) => !existingIds.has(agent.agentId) && !existingNames.has(agent.name.toLowerCase()));
      return [...incoming, ...missingProtected];
    },
    [protectedAgents],
  );

  const [agents, setAgents] = useState<AgentSummary[]>(() => ensureProtectedAgents([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(AGENT_LIST_URL, {
        headers: {
          accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Unable to load agent list");
      }
      const data = await response.json();
      if (Array.isArray(data.agents)) {
        const incomingAgents = data.agents.map(toAgentSummary);
        setAgents(ensureProtectedAgents(incomingAgents));
        return;
      }
      setAgents(ensureProtectedAgents([]));
    } catch (err) {
      console.error("Error fetching agent list", err);
      setError(err instanceof Error ? err.message : "Unable to load agent list");
      setAgents((prev) => (prev.length ? prev : ensureProtectedAgents([])));
    } finally {
      setLoading(false);
    }
  }, [ensureProtectedAgents]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const performAgentAction = useCallback(
    async (agentId: number, action: "start" | "stop") => {
      const endpoint = action === "start" ? "start" : "stop";
      try {
        const response = await fetch(`${AGENT_ACTION_BASE}/${endpoint}?agentId=${agentId}`, {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Unable to ${action} agent`);
        }
        const data = await response.json();
        console.log(`${action} agent response`, data);
        const serverPort = data?.port ?? null;
        setAgents((prev) =>
          prev.map((agent) =>
            agent.agentId === agentId
              ? {
                  ...agent,
                  running: action === "start",
                  status: action === "start" ? "healthy" : "warning",
                  startTime: action === "start" ? formatCurrentTime() : agent.startTime ?? null,
                  stopTime: action === "stop" ? formatCurrentTime() : agent.stopTime ?? null,
                  lastActionTime: formatCurrentTime(),
                  port: serverPort ?? agent.port,
                }
              : agent,
          ),
        );
      } catch (err) {
        console.error(`${action} agent error`, err);
      }
    },
    [],
  );

  const deleteAgent = useCallback(
    async (agentId: number) => {
      const isProtected = protectedAgents.some((agent) => agent.agentId === agentId);
      if (isProtected) {
        console.warn("Protected agent cannot be deleted");
        return;
      }
      try {
        const response = await fetch(`${AGENT_ACTION_BASE}/delete/${agentId}`, {
          method: "DELETE",
          headers: {
            accept: "application/json",
          },
        });
        const data = await response
          .json()
          .catch(() => null);
        console.log("Delete agent response", data);
        if (!response.ok) {
          throw new Error("Unable to delete agent");
        }
        setAgents((prev) => prev.filter((agent) => agent.agentId !== agentId));
      } catch (err) {
        console.error("Delete agent error", err);
        throw err;
      }
    },
    [protectedAgents],
  );

  const addAgent = useCallback(
    (agent: Omit<AgentSummary, "agentId"> & { agentId?: number; port?: number | null; deletable?: boolean }) => {
      setAgents((prev) => [
        {
          agentId: agent.agentId ?? Date.now(),
          name: agent.name,
          zone: agent.zone,
          status: agent.status,
          running: agent.running,
          type: agent.type,
          enterprise: agent.enterprise ?? null,
          port: agent.port ?? null,
          version: agent.version,
          lastActionTime: agent.lastActionTime ?? formatCurrentTime(),
          startTime: agent.startTime ?? null,
          stopTime: agent.stopTime ?? null,
          createdAt: agent.createdAt ?? formatCurrentTime(),
          deletable: agent.deletable ?? true,
        },
        ...prev,
      ]);
    },
    [],
  );

  return {
    agents,
    loading,
    error,
    refresh,
    performAgentAction,
    addAgent,
    deleteAgent,
  };
};
