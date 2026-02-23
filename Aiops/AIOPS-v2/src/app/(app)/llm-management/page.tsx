"use client";

import {
  RefreshCw,
  Settings,
  Trash2,
  CheckCircle2,
  Zap,
  Bot,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

type LLMRecord = {
  provider: string;
  description: string;
  model: string;
  createdAt: string;
  active: boolean;
};

const llms: LLMRecord[] = [
  {
    provider: "OpenAI",
    description: "Primary support model for incident analysis.",
    model: "gpt-4.1",
    createdAt: "2026-02-20T10:24:00",
    active: true,
  },
  {
    provider: "Anthropic",
    description: "Backup model for summarization and routing.",
    model: "claude-3.5",
    createdAt: "2026-02-18T14:05:00",
    active: false,
  },
  {
    provider: "Groq",
    description: "Low-latency chatops model.",
    model: "llama-3.1-70b",
    createdAt: "2026-02-17T09:40:00",
    active: true,
  },
];

export default function LLMManagementPage() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const { activeCount, inactiveCount, totalCount } = useMemo(() => {
    const total = llms.length;
    const active = llms.filter((item) => item.active).length;
    return {
      activeCount: active,
      inactiveCount: total - active,
      totalCount: total,
    };
  }, []);

  const statCards = [
    {
      title: "Active",
      value: activeCount,
      note: "Ready to respond",
      icon: CheckCircle2,
      tone: "from-[#18c964] to-[#00b56c]",
      noteColor: "text-[#16a34a]",
    },
    {
      title: "Inactive",
      value: inactiveCount,
      note: "Needs review",
      icon: Zap,
      tone: "from-[#2f80ff] to-[#1aa7ff]",
      noteColor: "text-[#3b82f6]",
    },
    {
      title: "Total LLMs",
      value: totalCount,
      note: "+1 added this month",
      icon: Bot,
      tone: "from-[#b45cff] to-[#ff5ac8]",
      noteColor: "text-[#e11d8d]",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white px-8 py-7 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                LLM management
              </h2>
              <p className="mt-2 text-sm text-[#5b6476]">
                Model availability, versions, and lifecycle status.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4f49e2] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(79,73,226,0.6)]"
            >
              + Create LLM
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f2] bg-white px-4 py-2 text-sm font-semibold text-[#4f49e2] shadow-[0_10px_20px_-16px_rgba(79,73,226,0.5)] transition hover:bg-[#eef2ff]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh LLMs
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="min-w-[220px] rounded-2xl bg-white p-5 shadow-[0_12px_30px_-28px_rgba(16,24,40,0.45)] ring-1 ring-[#eef1f7]"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-[0_10px_20px_-12px_rgba(0,0,0,0.45)]`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs font-semibold ${card.noteColor}`}>
                        {card.note}
                      </span>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-[#5a6476]">
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
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[#111827]">
              Large Language Models
            </h3>
            <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
              {llms.length}
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
                placeholder="Search Models.."
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
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
                onClick={() => setFilter("active")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  filter === "active"
                    ? "bg-[#4f49e2] text-white"
                    : "border border-[#e0e5f0] text-[#111827]"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFilter("inactive")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  filter === "inactive"
                    ? "bg-[#4f49e2] text-white"
                    : "border border-[#e0e5f0] text-[#111827]"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#eef1f7]">
          <div className="grid grid-cols-[1.3fr_2.2fr_1.6fr_1.4fr_0.8fr_0.8fr] bg-[#f3f6fb] px-4 py-3 text-xs font-semibold text-[#111827]">
            <span>Model Provider</span>
            <span>Description</span>
            <span>Model Name</span>
            <span>Created At</span>
            <span>Active</span>
            <span>Action</span>
          </div>
          <div className="divide-y divide-[#eef1f7] bg-white">
            {llms.map((item, index) => (
              <div
                key={`${item.model}-${index}`}
                className="grid grid-cols-[1.3fr_2.2fr_1.6fr_1.4fr_0.8fr_0.8fr] items-center px-4 py-4 text-sm text-[#2b3341]"
              >
                <span className="font-semibold text-[#1c2330]">
                  {item.provider}
                </span>
                <span>{item.description}</span>
                <span className="font-medium text-[#111827]">{item.model}</span>
                <span>{item.createdAt}</span>
                <span
                  className={`flex items-center gap-2 ${
                    item.active ? "text-[#1f7a1f]" : "text-[#b45309]"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      item.active ? "bg-[#16a34a]" : "bg-[#f59e0b]"
                    }`}
                  />
                  {item.active ? "Active" : "Inactive"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e5e7eb] text-[#111827]"
                  >
                    <Settings className="h-4 w-4" />
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
    </div>
  );
}
