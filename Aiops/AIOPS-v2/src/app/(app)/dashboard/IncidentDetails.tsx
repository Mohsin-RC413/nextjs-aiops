"use client";

import { AGENT_API_BASE_URL, AGENT_ORG_KEY } from "@/config/agent";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TriangleAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type IncidentItem = {
  number: string;
  short_description: string;
  opened_at: string;
  active: string;
  state: string;
  priority: string;
  status: string;
};

type AgentRecord = {
  agentId: number;
  port: number | null;
  status: string;
  enterprise: string;
};

const ROWS_PER_PAGE = 5;

export default function IncidentDetails() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentItem | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const requestIdRef = useRef(0);
  const pathname = usePathname();

  const agentApiBase = AGENT_API_BASE_URL.endsWith("/")
    ? AGENT_API_BASE_URL.slice(0, -1)
    : AGENT_API_BASE_URL;

  const loadIncidents = useCallback(
    async (options?: { signal?: AbortSignal; force?: boolean }) => {
      const requestId = ++requestIdRef.current;
      if (!options?.force) {
        setIsLoading(true);
      }
      setError("");

      try {
        const listResponse = await fetch(
          `${agentApiBase}/aiops/agent/list?orgKey=${encodeURIComponent(
            AGENT_ORG_KEY
          )}`,
          {
            headers: { accept: "application/json" },
            signal: options?.signal,
          }
        );
        const listData = await listResponse.json();

        if (requestId !== requestIdRef.current) {
          return;
        }

        const serviceNowAgent = Array.isArray(listData?.agents)
          ? (listData.agents as AgentRecord[]).find(
              (agent) =>
                agent.enterprise?.trim().toLowerCase() === "servicenow" &&
                agent.status?.toUpperCase() === "STARTED" &&
                agent.port
            )
          : null;

        if (!serviceNowAgent) {
          setIncidents([]);
          setLastRefresh(new Date().toLocaleString());
          return;
        }

        const detailsUrl = `http://192.168.18.20:${serviceNowAgent.port}/agent/serviceNow/incidentDetails`;
        const detailsResponse = await fetch(detailsUrl, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agent_id: String(serviceNowAgent.agentId) }),
          signal: options?.signal,
        });
        const detailsData = await detailsResponse.json();

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (detailsResponse.ok && Array.isArray(detailsData?.incidents)) {
          setIncidents(detailsData.incidents as IncidentItem[]);
        } else {
          setIncidents([]);
          setError("Unable to load incidents.");
        }
        setLastRefresh(new Date().toLocaleString());
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError("Unable to load incidents.");
        setLastRefresh(new Date().toLocaleString());
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [agentApiBase]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadIncidents({ signal: controller.signal });
    return () => controller.abort();
  }, [loadIncidents]);

  useEffect(() => {
    if (!pathname?.includes("dashboard")) {
      return;
    }
    loadIncidents({ force: true });
  }, [pathname, loadIncidents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, incidents.length]);

  const filteredIncidents = useMemo(() => {
    const list =
      filter === "all"
        ? incidents
        : incidents.filter(
            (item) =>
              String(item.status ?? "").toLowerCase() === filter
          );
    return [...list].sort((a, b) => {
      const aDate = new Date(a.opened_at.replace(" ", "T")).getTime();
      const bDate = new Date(b.opened_at.replace(" ", "T")).getTime();
      return bDate - aDate;
    });
  }, [incidents, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIncidents.length / ROWS_PER_PAGE)
  );
  const pagedIncidents = filteredIncidents.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handleRefresh = () => {
    loadIncidents({ force: true });
  };

  const renderTable = (expanded: boolean) => (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#eef1f7]">
      <div
        className={`grid ${
          expanded
            ? "grid-cols-[1.1fr_3fr_0.8fr_1.2fr_0.8fr_0.8fr]"
            : "grid-cols-[1.1fr_3fr_0.8fr_1.2fr_0.8fr_0.8fr_0.9fr]"
        } bg-[#f3f6fb] px-4 py-3 text-xs font-semibold text-[#111827]`}
      >
        <span>Incident ID</span>
        <span>Description</span>
        <span>State</span>
        <span>Opened At</span>
        <span>Active</span>
        <span>{expanded ? "Priority" : "Status"}</span>
        {expanded ? null : <span></span>}
      </div>
      <div className="divide-y divide-[#eef1f7] bg-white">
        {pagedIncidents.map((row, index) => (
          <div
            key={`${row.number}-${index}`}
            className={`grid ${
              expanded
                ? "grid-cols-[1.1fr_3fr_0.8fr_1.2fr_0.8fr_0.8fr]"
                : "grid-cols-[1.1fr_3fr_0.8fr_1.2fr_0.8fr_0.8fr_0.9fr]"
            } items-center px-4 py-4 text-sm text-[#2b3341]`}
          >
            <span className="font-semibold text-[#1c2330]">{row.number}</span>
            <span>{row.short_description}</span>
            <span>{row.state}</span>
            <span>{row.opened_at}</span>
            <span>{row.active}</span>
            <span>{expanded ? row.priority : row.status}</span>
            {expanded ? null : (
              <button
                type="button"
                onClick={() => setSelectedIncident(row)}
                className="ml-auto rounded-lg bg-[#4f49e2] px-4 py-2 text-xs font-semibold text-white"
              >
                View
              </button>
            )}
          </div>
        ))}

        {!isLoading && !error && pagedIncidents.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[#647087]">
            No incidents found.
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#ffe9e1] text-[#ff7a45]">
              <TriangleAlert className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold text-[#111827]">
              Incident details
            </h3>
            <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
              {incidents.length}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#5b6476]">
            {lastRefresh
              ? `Last refreshed: ${lastRefresh}`
              : "Last refreshed: --"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[#e0e5f0] bg-white px-2 py-1 text-xs font-semibold text-[#4f49e2]">
            <button
              type="button"
              onClick={() => setFilter("open")}
              className={`rounded-full px-3 py-1 ${
                filter === "open"
                  ? "bg-[#4f49e2] text-white"
                  : "text-[#4f49e2]"
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setFilter("closed")}
              className={`rounded-full px-3 py-1 ${
                filter === "closed"
                  ? "bg-[#4f49e2] text-white"
                  : "text-[#4f49e2]"
              }`}
            >
              Closed
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-1 ${
                filter === "all"
                  ? "bg-[#4f49e2] text-white"
                  : "text-[#4f49e2]"
              }`}
            >
              All
            </button>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e3e7f2] bg-white text-[#6b7280] shadow-[0_8px_16px_-14px_rgba(16,24,40,0.4)] transition ${
              isLoading
                ? "cursor-not-allowed opacity-60"
                : "hover:text-[#4f49e2]"
            }`}
            aria-label="Refresh incidents"
            title="Refresh incidents"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-2xl border border-[#eef1f7] bg-white px-5 py-6 text-sm text-[#647087]">
          Loading incidents...
        </div>
      ) : error ? (
        <div className="mt-5 rounded-2xl border border-[#fee2e2] bg-[#fff5f5] px-5 py-6 text-sm text-[#b91c1c]">
          {error}
        </div>
      ) : (
        renderTable(false)
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
            currentPage === 1
              ? "cursor-not-allowed border-[#e0e5f0] text-[#94a3b8]"
              : "border-[#e0e5f0] text-[#111827] hover:bg-[#f3f4f6]"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="text-xs font-semibold text-[#5b6476]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage >= totalPages}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
            currentPage >= totalPages
              ? "cursor-not-allowed border-[#e0e5f0] text-[#94a3b8]"
              : "border-[#e0e5f0] text-[#111827] hover:bg-[#f3f4f6]"
          }`}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {selectedIncident ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.7)]">
            <div className="flex items-start justify-between border-b border-[#eef1f7] px-8 py-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-[#111827]">
                    Incident details
                  </h3>
                  <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
                    {selectedIncident.number}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5b6476]">
                  {lastRefresh
                    ? `Last refreshed: ${lastRefresh}`
                    : "Last refreshed: --"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
              <div className="grid gap-4 rounded-2xl border border-[#eef1f7] bg-white p-6 text-sm text-[#2b3341]">
                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Incident ID
                  </span>
                  <span className="font-semibold text-[#1c2330]">
                    {selectedIncident.number}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Description
                  </span>
                  <span>{selectedIncident.short_description}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Opened At
                  </span>
                  <span>{selectedIncident.opened_at}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Status
                  </span>
                  <span>{selectedIncident.status}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    State
                  </span>
                  <span>{selectedIncident.state}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Active
                  </span>
                  <span>{selectedIncident.active}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Priority
                  </span>
                  <span>{selectedIncident.priority}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center border-t border-[#eef1f7] px-8 py-4">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-sm font-semibold text-[#4f49e2] hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
