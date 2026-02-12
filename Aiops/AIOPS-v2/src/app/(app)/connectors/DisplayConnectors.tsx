"use client";

import { Link2, Pencil, Plug, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AGENT_API_BASE_URL,
  AGENT_CONNECTORS_BASE_URL,
  AGENT_ORG_KEY,
} from "@/config/agent";

type ConnectorItem = {
  id: number;
  connector_type: string;
  provider_code: string;
  is_active: "Y" | "N" | string;
  created_at: string;
  updated_at: string;
};

type AgentRecord = {
  agentId: number;
  name: string;
  port: number | null;
  status: string;
  enterprise: string;
  start_time: string | null;
  stop_time: string | null;
};

const providerLogoMap: Record<string, string> = {
  ServiceNow: "/img/ServiceNow.png",
  Mule: "/img/Mule.png",
  Teams: "/img/Teams.webp",
  MQ: "/img/MQ.png",
  SAP: "/img/SAP.png",
  SalesForce: "/img/SalesForce.png",
  "MainFrame 400": "/img/MainFrame 400.png",
  Jira: "/img/Jira.jfif",
  Slack: "/img/Slack.png",
  Zoom: "/img/Zoom.png",
  Zendesk: "/img/Zendesk.png",
  Exchange: "/img/Exchange.png",
  Gmail: "/img/Gmail.png",
};

const formatDateTime = (value: string) => {
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return { date: "--", time: "--" };
  }
  return {
    date: date.toLocaleDateString("en-US"),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

type DisplayConnectorsProps = {
  refreshKey?: number;
  searchTerm?: string;
};

export default function DisplayConnectors({
  refreshKey,
  searchTerm,
}: DisplayConnectorsProps) {
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConnectorItem | null>(null);

  const connectorsUrl = useMemo(
    () => `${AGENT_CONNECTORS_BASE_URL}/aiops/connectors`,
    []
  );
  const agentListUrl = useMemo(() => {
    const base = AGENT_API_BASE_URL.endsWith("/")
      ? AGENT_API_BASE_URL.slice(0, -1)
      : AGENT_API_BASE_URL;
    return `${base}/aiops/agent/list?orgKey=${encodeURIComponent(
      AGENT_ORG_KEY
    )}`;
  }, []);

  const loadConnectors = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch(connectorsUrl, {
          method: "GET",
          headers: {
            accept: "application/json",
            "X-Organization-Key": AGENT_ORG_KEY,
          },
          signal,
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data?.connectors)) {
          setConnectors(data.connectors as ConnectorItem[]);
        } else {
          setConnectors([]);
          setLoadError("Unable to load connectors.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setConnectors([]);
        setLoadError("Unable to load connectors.");
      } finally {
        setIsLoading(false);
      }
    },
    [connectorsUrl]
  );

  const loadAgents = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(agentListUrl, {
          headers: { accept: "application/json" },
          signal,
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data?.agents)) {
          setAgents(data.agents as AgentRecord[]);
        } else {
          setAgents([]);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setAgents([]);
      }
    },
    [agentListUrl]
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadAll = async () => {
      await Promise.all([loadConnectors(signal), loadAgents(signal)]);
    };

    loadAll();

    return () => {
      controller.abort();
    };
  }, [loadAgents, loadConnectors, refreshKey]);

  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-[#eef1f7] bg-white px-5 py-8 text-sm text-[#647087]">
        Loading connectors...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-6 rounded-2xl border border-[#fee2e2] bg-[#fff5f5] px-5 py-8 text-sm text-[#b91c1c]">
        {loadError}
      </div>
    );
  }

  if (connectors.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-[#e6eaf3] bg-white px-6 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2]">
          <Link2 className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-[#111827]">
          No connectors yet
        </p>
        <p className="mt-2 text-sm text-[#6b7280]">
          Add a connector to start integrating your systems.
        </p>
      </div>
    );
  }

  const normalizedSearch = (searchTerm ?? "").trim().toLowerCase();
  const visibleConnectors = normalizedSearch
    ? connectors.filter((connector) => {
        const provider = connector.provider_code?.toLowerCase() ?? "";
        const type = connector.connector_type?.toLowerCase() ?? "";
        return provider.includes(normalizedSearch) || type.includes(normalizedSearch);
      })
    : connectors;

  if (visibleConnectors.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-[#e6eaf3] bg-white px-6 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2]">
          <Link2 className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-[#111827]">
          No connectors found
        </p>
        <p className="mt-2 text-sm text-[#6b7280]">
          Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      {visibleConnectors.map((connector) => {
        const isActive = String(connector.is_active).toUpperCase() === "Y";
        const created = formatDateTime(connector.created_at);
        const updated = formatDateTime(connector.updated_at);
        const logoSrc = providerLogoMap[connector.provider_code] ?? "";
        const isAgentRunning = agents.some(
          (agent) =>
            agent.enterprise?.trim().toLowerCase() ===
              connector.provider_code.trim().toLowerCase() &&
            agent.status?.toUpperCase() === "STARTED"
        );
        const isDeleteDisabled = isAgentRunning || deletingId === connector.id;
        return (
          <div
            key={connector.id}
            className="rounded-2xl bg-white p-5 shadow-[0_12px_30px_-24px_rgba(16,24,40,0.35)] ring-1 ring-[#eef1f7]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f49e2]">
                    <Plug className="h-4 w-4" />
                  </span>
                  <p className="text-lg font-semibold text-[#111827]">
                    {connector.provider_code}
                  </p>
                </div>
                <p className="mt-3 text-sm text-[#5b6476]">
                  Created: {created.date} {created.time}
                </p>
                <p className="mt-2 text-sm text-[#5b6476]">
                  Updated: {updated.date} {updated.time}
                </p>
              </div>
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${connector.provider_code} logo`}
                  className="h-12 w-20 object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="h-8 w-8" aria-hidden="true" />
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span
                className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold ${
                  isActive
                    ? "bg-[#158a00] text-white"
                    : "bg-[#e7f3e2] text-[#148a3b]"
                }`}
              >
                Active
              </span>
              <span
                className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold ${
                  isActive
                    ? "bg-[#ffe8ea] text-[#ff3344]"
                    : "bg-[#ff2d2d] text-white"
                }`}
              >
                Inactive
              </span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#cbd2ff] text-[#4f49e2]"
                aria-label={`Edit ${connector.provider_code} connector`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isDeleteDisabled) {
                    return;
                  }
                  setDeleteTarget(connector);
                }}
                disabled={isDeleteDisabled}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
                  isDeleteDisabled
                    ? "cursor-not-allowed border-[#e5e7eb] text-[#9ca3af]"
                    : "border-[#fecaca] text-[#ef4444] hover:bg-[#fee2e2]"
                }`}
                aria-label={`Delete ${connector.provider_code} connector`}
                title={
                  isAgentRunning
                    ? "Stop the agent before deleting this connector."
                    : "Delete connector"
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4 py-8">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between border-b border-[#eef1f7] px-6 py-4">
              <h4 className="text-lg font-semibold text-[#111827]">
                Delete Connector
              </h4>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#374151]">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#111827]">
                  {deleteTarget.provider_code}
                </span>
                ?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#eef1f7] px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#374151]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!deleteTarget) {
                    return;
                  }
                  setDeletingId(deleteTarget.id);
                  try {
                    const url = `${AGENT_CONNECTORS_BASE_URL}/aiops/connectors/${deleteTarget.id}/delete?orgKey=${encodeURIComponent(
                      AGENT_ORG_KEY
                    )}`;
                    const response = await fetch(url, {
                      method: "POST",
                      headers: {
                        accept: "application/json",
                        "X-Organization-Key": AGENT_ORG_KEY,
                      },
                    });
                    const data = await response.json().catch(() => null);
                    if (response.ok && data?.deleted) {
                      await loadConnectors();
                      await loadAgents();
                      setDeleteTarget(null);
                    } else {
                      setLoadError("Unable to delete connector.");
                    }
                  } catch (error) {
                    setLoadError("Unable to delete connector.");
                  } finally {
                    setDeletingId(null);
                  }
                }}
                disabled={deletingId === deleteTarget.id}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white ${
                  deletingId === deleteTarget.id
                    ? "cursor-not-allowed bg-[#fca5a5]"
                    : "bg-[#ef4444] shadow-[0_10px_24px_-18px_rgba(239,68,68,0.8)] hover:bg-[#dc2626]"
                }`}
              >
                {deletingId === deleteTarget.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
