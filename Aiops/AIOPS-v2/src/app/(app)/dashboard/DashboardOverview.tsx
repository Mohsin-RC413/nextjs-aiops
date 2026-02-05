"use client";

import { AGENT_API_BASE_URL, AGENT_ORG_KEY } from "@/config/agent";
import { Bot, CheckCircle2, Loader2, TriangleAlert, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AgentRecord = {
  agentId: number;
  name: string;
  port: number | null;
  status: string;
  enterprise: string;
};

const AGENT_API_BASE = AGENT_API_BASE_URL.endsWith("/")
  ? AGENT_API_BASE_URL.slice(0, -1)
  : AGENT_API_BASE_URL;
const AGENT_LIST_URL = `${AGENT_API_BASE}/aiops/agent/list`;

const baseStatCards = [
  {
    title: "Total Incidents",
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

export default function DashboardOverview() {
  const [incidentCount, setIncidentCount] = useState<string>("--");
  const [isIncidentLoading, setIsIncidentLoading] = useState(false);

  const loadIncidentCount = useCallback(async (signal?: AbortSignal) => {
    setIncidentCount("--");
    setIsIncidentLoading(false);

    try {
      const listResponse = await fetch(
        `${AGENT_LIST_URL}?orgKey=${encodeURIComponent(AGENT_ORG_KEY)}`,
        {
          headers: { accept: "application/json" },
          signal,
        }
      );
      const listData = await listResponse.json();

      if (!listResponse.ok || !Array.isArray(listData?.agents)) {
        return;
      }

      const serviceNowAgent = (listData.agents as AgentRecord[]).find(
        (agent) =>
          agent.enterprise?.trim().toLowerCase() === "servicenow" &&
          agent.status?.toUpperCase() === "STARTED" &&
          agent.port
      );

      if (!serviceNowAgent) {
        return;
      }

      setIsIncidentLoading(true);

      const countUrl = `http://192.168.18.20:${serviceNowAgent.port}/agent/serviceNow/count`;
      const countResponse = await fetch(countUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agent_id: String(serviceNowAgent.agentId) }),
        signal,
      });
      const countData = await countResponse.json();
      console.log("ServiceNow count response:", {
        ok: countResponse.ok,
        status: countResponse.status,
        data: countData,
      });

      if (countResponse.ok && typeof countData?.count === "number") {
        setIncidentCount(String(countData.count));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setIncidentCount("--");
    } finally {
      setIsIncidentLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadIncidentCount(controller.signal);
    return () => controller.abort();
  }, [loadIncidentCount]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadIncidentCount();
      }
    };

    const handleFocus = () => loadIncidentCount();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadIncidentCount]);

  const statCards = baseStatCards.map((card) =>
    card.title === "Total Incidents"
      ? { ...card, value: incidentCount, isLoading: isIncidentLoading }
      : card
  );

  return (
    <section className="rounded-3xl bg-white px-8 py-7 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_2fr]">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#10131a]">
              Welcome back, Alice!
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
                <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-[#0f1115]">
                  {"isLoading" in card && card.isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[#5b4cf0]" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
