"use client";

import { Link2, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AGENT_CONNECTORS_BASE_URL, AGENT_ORG_KEY } from "@/config/agent";

type ConnectorItem = {
  id: number;
  connector_type: string;
  provider_code: string;
  is_active: "Y" | "N" | string;
  created_at: string;
  updated_at: string;
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

export default function DisplayConnectors() {
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const connectorsUrl = useMemo(
    () => `${AGENT_CONNECTORS_BASE_URL}/aiops/connectors`,
    []
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadConnectors = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch(connectorsUrl, {
          method: "GET",
          headers: {
            accept: "application/json",
            "X-Organization-Key": AGENT_ORG_KEY,
          },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!isMounted) {
          return;
        }
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
        if (isMounted) {
          setConnectors([]);
          setLoadError("Unable to load connectors.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConnectors();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [connectorsUrl]);

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

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      {connectors.map((connector) => {
        const isActive = String(connector.is_active).toUpperCase() === "Y";
        const { date, time } = formatDateTime(connector.created_at);
        return (
          <div
            key={connector.id}
            className="rounded-2xl bg-white p-5 shadow-[0_12px_30px_-24px_rgba(16,24,40,0.35)] ring-1 ring-[#eef1f7]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[#111827]">
                  {connector.provider_code} Agent
                </p>
                <p className="mt-3 text-sm text-[#5b6476]">Date: {date}</p>
                <p className="mt-2 text-sm text-[#5b6476]">Time: {time}</p>
              </div>
              <span className="h-8 w-8" aria-hidden="true" />
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
