'use client';

import { AGENT_SERVICE_HOST } from "@/config/api";
import { AgentSummary } from "@/lib/useAgents";
import {
  Bot,
  BookOpen,
  Eye,
  ListChecks,
  Pencil,
  PlusCircle,
  Settings,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

type DropdownOption = { label: string; value: string };
const settingsTabs = [
  { key: "ruleset", label: "Ruleset", icon: ListChecks },
  { key: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { key: "security", label: "Security", icon: Shield },
] as const;
type SettingsTab = (typeof settingsTabs)[number]["key"];
const rulesetTabs = [
  { key: "view", label: "View Ruleset", icon: Eye },
  { key: "add", label: "Add Ruleset", icon: PlusCircle },
] as const;
type RulesetTab = (typeof rulesetTabs)[number]["key"];

const getMuleDropdownBase = (port: number) => `${AGENT_SERVICE_HOST}:${port}/agent/mule/dropdown`;
const getMuleRulesetBase = (port: number) => `${AGENT_SERVICE_HOST}:${port}/agent/mule`;

const getSettingsStorageKey = (
  suffix: "application" | "platform" | "status" | "ticket" | "notifications" | "frequency",
  agentId: number,
  appName?: string,
) => `agent-settings-${suffix}-${agentId}${appName ? `-${appName}` : ""}`;

type AgentSettingsModalProps = {
  agent: AgentSummary;
};

export function AgentSettingsModal({ agent }: AgentSettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("ruleset");
  const [rulesetTab, setRulesetTab] = useState<RulesetTab>("view");
  const [applicationOptions, setApplicationOptions] = useState<DropdownOption[]>([]);
  const [applicationValue, setApplicationValue] = useState("");
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [platformOptions, setPlatformOptions] = useState<DropdownOption[]>([]);
  const [platformValue, setPlatformValue] = useState("");
  const [platformLoading, setPlatformLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<DropdownOption[]>([]);
  const [statusSelection, setStatusSelection] = useState<string[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [ticketOptions, setTicketOptions] = useState<DropdownOption[]>([]);
  const [ticketValue, setTicketValue] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [notificationOptions, setNotificationOptions] = useState<DropdownOption[]>([]);
  const [notificationSelection, setNotificationSelection] = useState<string[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [frequencyOptions, setFrequencyOptions] = useState<DropdownOption[]>([]);
  const [frequencyValue, setFrequencyValue] = useState("");
  const [frequencyLoading, setFrequencyLoading] = useState(false);
  const [rulesetItems, setRulesetItems] = useState<Record<string, unknown>[]>([]);
  const [rulesetLoading, setRulesetLoading] = useState(false);
  const [rulesetError, setRulesetError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openModal = () => {
    setIsOpen(true);
    setSettingsTab("ruleset");
    setRulesetTab("view");
    setApplicationOptions([]);
    setApplicationValue("");
    setApplicationLoading(false);
    setPlatformOptions([]);
    setPlatformValue("");
    setPlatformLoading(false);
    setStatusOptions([]);
    setStatusSelection([]);
    setStatusLoading(false);
    setTicketOptions([]);
    setTicketValue("");
    setTicketLoading(false);
    setNotificationOptions([]);
    setNotificationSelection([]);
    setNotificationLoading(false);
    setFrequencyOptions([]);
    setFrequencyValue("");
    setFrequencyLoading(false);
    setRulesetItems([]);
    setRulesetLoading(false);
    setRulesetError(null);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSettingsTab("ruleset");
    setRulesetTab("view");
    setApplicationOptions([]);
    setApplicationValue("");
    setApplicationLoading(false);
    setPlatformOptions([]);
    setPlatformValue("");
    setPlatformLoading(false);
    setStatusOptions([]);
    setStatusSelection([]);
    setStatusLoading(false);
    setTicketOptions([]);
    setTicketValue("");
    setTicketLoading(false);
    setNotificationOptions([]);
    setNotificationSelection([]);
    setNotificationLoading(false);
    setFrequencyOptions([]);
    setFrequencyValue("");
    setFrequencyLoading(false);
    setRulesetItems([]);
    setRulesetLoading(false);
    setRulesetError(null);
    if (typeof window !== "undefined") {
      const keyPrefix = "agent-settings-";
      const agentToken = `-${agent.agentId}`;
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith(keyPrefix) && key.includes(agentToken)) {
          localStorage.removeItem(key);
        }
      }
    }
  };

  const handleApplicationChange = (value: string) => {
    setApplicationValue(value);
    setPlatformValue("");
    setPlatformOptions([]);
    setPlatformLoading(false);
    if (typeof window !== "undefined" && value) {
      localStorage.setItem(getSettingsStorageKey("application", agent.agentId), value);
    }
  };

  const handlePlatformChange = (value: string) => {
    setPlatformValue(value);
    setStatusOptions([]);
    setStatusSelection([]);
    setStatusLoading(false);
    setTicketOptions([]);
    setTicketValue("");
    setTicketLoading(false);
    setNotificationOptions([]);
    setNotificationSelection([]);
    setNotificationLoading(false);
    setFrequencyOptions([]);
    setFrequencyValue("");
    setFrequencyLoading(false);
    if (typeof window !== "undefined" && value) {
      localStorage.setItem(getSettingsStorageKey("platform", agent.agentId), value);
    }
  };

  const handleStatusToggle = (value: string) => {
    setStatusSelection((prev) => {
      const next = prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value];
      if (typeof window !== "undefined" && platformValue) {
        const storageKey = getSettingsStorageKey("status", agent.agentId, platformValue);
        if (next.length === 0) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
      }
      return next;
    });
  };

  const handleTicketChange = (value: string) => {
    setTicketValue(value);
    if (typeof window !== "undefined" && platformValue) {
      localStorage.setItem(getSettingsStorageKey("ticket", agent.agentId, platformValue), value);
    }
  };

  const handleNotificationToggle = (value: string) => {
    setNotificationSelection((prev) => {
      const next = prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value];
      if (typeof window !== "undefined" && platformValue) {
        const storageKey = getSettingsStorageKey("notifications", agent.agentId, platformValue);
        if (next.length === 0) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
      }
      return next;
    });
  };

  const handleFrequencyChange = (value: string) => {
    setFrequencyValue(value);
    if (typeof window !== "undefined" && platformValue) {
      localStorage.setItem(getSettingsStorageKey("frequency", agent.agentId, platformValue), value);
    }
  };

  const handleSave = async () => {
    if (!agent.port) {
      return;
    }
    if (!applicationValue || !platformValue || !ticketValue || !frequencyValue) {
      return;
    }
    const payload = {
      agent_id: String(agent.agentId),
      target_type: applicationValue,
      target_value: platformValue,
      target_name: platformValue,
      conditions: statusSelection,
      raise_ticket: ticketValue,
      notifications: notificationSelection,
      frequency: frequencyValue,
    };
    console.log("Ruleset save payload", payload);
    setIsSaving(true);
    try {
      const response = await fetch(`${getMuleRulesetBase(agent.port)}/ruleset/save`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      try {
        console.log("Ruleset save response", JSON.parse(text));
      } catch {
        console.log("Ruleset save response", text);
      }
    } catch (error) {
      console.error("Ruleset save error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasRulesetFields = (record: Record<string, unknown>) => {
    const keys = [
      "target_type",
      "target_value",
      "target_name",
      "conditions",
      "raise_ticket",
      "notifications",
      "frequency",
    ];
    return keys.some((key) => key in record);
  };

  const normalizeRulesets = (data: unknown) => {
    if (Array.isArray(data)) {
      return data as Record<string, unknown>[];
    }
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      const candidate = record.rulesets ?? record.data ?? record.items ?? record.results ?? record.list;
      if (Array.isArray(candidate)) {
        return candidate as Record<string, unknown>[];
      }
      if (candidate && typeof candidate === "object" && hasRulesetFields(candidate as Record<string, unknown>)) {
        return [candidate as Record<string, unknown>];
      }
      if (hasRulesetFields(record)) {
        return [record];
      }
    }
    return [];
  };

  const getRulesetField = (ruleset: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = ruleset[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  };

  const formatRulesetValue = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.map((item) => String(item)).join(", ") : "—";
    }
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const normalizeRulesetList = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (value === null || value === undefined) {
      return [];
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const jsonCandidate = trimmed.replace(/'/g, "\"");
        try {
          const parsed = JSON.parse(jsonCandidate);
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).trim()).filter(Boolean);
          }
        } catch {
          // Fall through to manual parsing.
        }
        const inner = trimmed.slice(1, -1);
        return inner
          .split(",")
          .map((item) => item.replace(/['"]/g, "").trim())
          .filter(Boolean);
      }
      if (trimmed.includes(",")) {
        return trimmed
          .split(",")
          .map((item) => item.replace(/['"]/g, "").trim())
          .filter(Boolean);
      }
      return [trimmed.replace(/['"]/g, "").trim()].filter(Boolean);
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return [String(value)];
    }
    return [];
  };

  const renderRulesetList = (value: unknown) => {
    const items = normalizeRulesetList(value);
    const text = items.length > 0 ? items.join(", ") : "--";
    const toneClass = items.length > 0 ? "text-slate-700 font-semibold" : "text-slate-400";
    return <p className={`mt-2 text-sm ${toneClass}`}>{text}</p>;
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!agent.agentId || !agent.port) {
      setApplicationOptions([]);
      setApplicationLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setApplicationLoading(true);
      try {
        const response = await fetch(`${getMuleDropdownBase(agent.port)}/target-types`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agent_id: String(agent.agentId) }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load application options");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setApplicationOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setApplicationOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setApplicationLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [agent.agentId, agent.port, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!agent.agentId || !agent.port || !applicationValue) {
      setPlatformOptions([]);
      setPlatformLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setPlatformLoading(true);
      try {
        const response = await fetch(`${getMuleDropdownBase(agent.port)}/targets`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: String(agent.agentId),
            target_types: applicationValue,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load platform options");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setPlatformOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPlatformOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setPlatformLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [agent.agentId, agent.port, applicationValue, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!agent.agentId || !platformValue) {
      setStatusSelection([]);
      setTicketValue("");
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const storedStatus = localStorage.getItem(
      getSettingsStorageKey("status", agent.agentId, platformValue),
    );
    if (storedStatus) {
      try {
        const parsed = JSON.parse(storedStatus);
        setStatusSelection(Array.isArray(parsed) ? parsed : []);
      } catch {
        setStatusSelection([]);
      }
    } else {
      setStatusSelection([]);
    }
    const storedTicket = localStorage.getItem(
      getSettingsStorageKey("ticket", agent.agentId, platformValue),
    );
    setTicketValue(storedTicket ?? "");
    const storedNotifications = localStorage.getItem(
      getSettingsStorageKey("notifications", agent.agentId, platformValue),
    );
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        setNotificationSelection(Array.isArray(parsed) ? parsed : []);
      } catch {
        setNotificationSelection([]);
      }
    } else {
      setNotificationSelection([]);
    }
    const storedFrequency = localStorage.getItem(
      getSettingsStorageKey("frequency", agent.agentId, platformValue),
    );
    setFrequencyValue(storedFrequency ?? "");
  }, [agent.agentId, isOpen, platformValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!agent.agentId || !agent.port || !platformValue) {
      setStatusOptions([]);
      setStatusLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setStatusLoading(true);
      try {
        const response = await fetch(`${getMuleDropdownBase(agent.port)}/status`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: String(agent.agentId),
            app_name: platformValue,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load status options");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setStatusOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatusOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setStatusLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [agent.agentId, agent.port, isOpen, platformValue]);

  useEffect(() => {
    if (!isOpen || settingsTab !== "ruleset" || rulesetTab !== "view") {
      return;
    }
    if (!agent.agentId || !agent.port) {
      setRulesetItems([]);
      setRulesetLoading(false);
      setRulesetError(null);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setRulesetLoading(true);
      setRulesetError(null);
      try {
        const response = await fetch(
          `${getMuleRulesetBase(agent.port)}/ruleset/list/${agent.agentId}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
            },
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error("Unable to load rulesets");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setRulesetItems(normalizeRulesets(data));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setRulesetItems([]);
          setRulesetError("Unable to load rulesets right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setRulesetLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [agent.agentId, agent.port, isOpen, rulesetTab, settingsTab]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!agent.agentId || !agent.port || !platformValue) {
      setNotificationOptions([]);
      setNotificationLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setNotificationLoading(true);
      try {
        const response = await fetch(`${getMuleDropdownBase(agent.port)}/notifications`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: String(agent.agentId),
            app_name: platformValue,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load notification options");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setNotificationOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setNotificationOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setNotificationLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [agent.agentId, agent.port, isOpen, platformValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!agent.agentId || !agent.port || !platformValue) {
      setFrequencyOptions([]);
      setFrequencyLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setFrequencyLoading(true);
      try {
        const response = await fetch(`${getMuleDropdownBase(agent.port)}/frequency`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: String(agent.agentId),
            app_name: platformValue,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load frequency options");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setFrequencyOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setFrequencyOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setFrequencyLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [agent.agentId, agent.port, isOpen, platformValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!agent.agentId || !agent.port || !platformValue) {
      setTicketOptions([]);
      setTicketLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setTicketLoading(true);
      try {
        const response = await fetch(`${getMuleDropdownBase(agent.port)}/ticket`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: String(agent.agentId),
            app_name: platformValue,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load ticket options");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setTicketOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setTicketOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setTicketLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [agent.agentId, agent.port, isOpen, platformValue]);

  const hasSingleRuleset = !rulesetLoading && !rulesetError && rulesetItems.length === 1;

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 items-center justify-center rounded-md bg-slate-100 px-3 text-slate-700 shadow-sm transition hover:bg-slate-200"
        aria-label={`Edit ${agent.name}`}
        title="Edit"
        onClick={openModal}
      >
        <Settings className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-[80vw] min-h-[620px] max-h-[80vh] rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.35)] flex flex-col overflow-hidden">
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-start">
                <div />
                <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.32em] text-slate-700">
                  <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                  Agent settings
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                  <Bot className="h-6 w-6 text-slate-500" aria-hidden="true" />
                  <span>{agent.name}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${agent.running ? "bg-emerald-500" : "bg-slate-300"}`}
                    aria-label={agent.running ? "Online" : "Offline"}
                  />
                </h3>
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1 ${
                    hasSingleRuleset
                      ? "bg-red-500 text-true-white shadow-[0_10px_20px_rgba(244,67,54,0.25)]"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className={`text-lg font-semibold ${hasSingleRuleset ? "text-true-white" : "text-slate-900"}`}>
                    {rulesetError ? "--" : rulesetLoading ? "..." : rulesetItems.length.toString()}
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                      hasSingleRuleset ? "text-true-white" : "text-slate-500"
                    }`}
                  >
                    Rulesets
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {settingsTabs.map((tab) => {
                const isActive = settingsTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSettingsTab(tab.key)}
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] transition-colors duration-200 ${
                      isActive
                        ? "bg-red-500 text-true-white shadow-[0_10px_20px_rgba(244,67,54,0.25)]"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
              <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-inner flex flex-1 flex-col">
                {settingsTab === "ruleset" ? (
                  <div className="space-y-5">
                    <div className="grid w-full grid-cols-2 gap-2 rounded-full border border-slate-200/70 bg-slate-100/70 p-1.5 shadow-sm">
                      {rulesetTabs.map((tab) => {
                        const isActive = rulesetTab === tab.key;
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setRulesetTab(tab.key)}
                            className={`w-full rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em] transition-colors duration-200 ${
                            isActive
                              ? "bg-red-500 text-true-white shadow-[0_10px_20px_rgba(244,67,54,0.25)]"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <span className="inline-flex w-full items-center justify-center gap-2">
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {tab.label}
                          </span>
                          </button>
                        );
                      })}
                    </div>
                    {rulesetTab === "view" ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Saved rulesets</p>
                          </div>
                          <p className="text-xs text-slate-500">
                            {rulesetLoading ? "Loading..." : `${rulesetItems.length} total`}
                          </p>
                        </div>
                        {rulesetLoading ? (
                          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 text-sm text-slate-500">
                            Loading rulesets...
                          </div>
                        ) : rulesetError ? (
                          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-6 text-sm text-rose-600">
                            {rulesetError}
                          </div>
                        ) : rulesetItems.length === 0 ? (
                          <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
                            <p className="text-sm font-semibold text-slate-700">No rulesets</p>
                            <p className="mt-2 text-sm text-slate-500">
                              No rulesets to show yet. Switch to Add Ruleset to create your first one.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {rulesetItems.map((ruleset, index) => {
                              const nameValue = getRulesetField(ruleset, [
                                "target_name",
                                "target_value",
                                "app_name",
                                "name",
                              ]);
                              const targetType = getRulesetField(ruleset, [
                                "target_type",
                                "application",
                                "app_type",
                              ]);
                              const targetValue = getRulesetField(ruleset, [
                                "target_value",
                                "platform",
                                "app_name",
                                "target",
                              ]);
                              const ticketValue = getRulesetField(ruleset, [
                                "raise_ticket",
                                "ticket",
                                "ticketing_agent",
                              ]);
                              const frequencyValue = getRulesetField(ruleset, [
                                "frequency",
                                "run_frequency",
                              ]);
                              const conditionsValue = getRulesetField(ruleset, [
                                "conditions",
                                "status",
                                "status_conditions",
                              ]);
                              const notificationsValue = getRulesetField(ruleset, [
                                "notifications",
                                "notification_agents",
                                "notification",
                              ]);
                              const title =
                                formatRulesetValue(nameValue) !== "—"
                                  ? formatRulesetValue(nameValue)
                                  : `Ruleset ${index + 1}`;
                              return (
                                <div
                                  key={`ruleset-${index}`}
                                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                                        Ruleset {index + 1}
                                      </p>
                                      <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {formatRulesetValue(targetType)}
                                      </p>
                                    </div>
                                    <span className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 p-1.5 text-red-600">
                                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    </span>
                                  </div>
                                  <div className="mt-4 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                        <span className="whitespace-nowrap">Platform</span>
                                        <div className="text-sm font-semibold text-slate-700">
                                          {formatRulesetValue(targetType)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                        <span className="whitespace-nowrap">Application</span>
                                        <div className="text-sm font-semibold text-slate-700">
                                          {formatRulesetValue(targetValue)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                        <span className="whitespace-nowrap">Ticketing Running Agent</span>
                                        <div className="text-sm font-semibold text-slate-700">
                                          {formatRulesetValue(ticketValue)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-3">
                                      <div className="flex flex-col items-start text-left">
                                        <div className="inline-flex items-center gap-2 whitespace-nowrap">
                                          <p className="text-xs uppercase tracking-wide text-slate-400">Frequency</p>
                                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                          {formatRulesetValue(frequencyValue)}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-start text-left">
                                        <div className="inline-flex items-center gap-2 whitespace-nowrap">
                                          <p className="text-xs uppercase tracking-wide text-slate-400">Conditions</p>
                                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        {renderRulesetList(conditionsValue)}
                                      </div>
                                      <div className="flex flex-col items-start text-left">
                                        <div className="inline-flex items-center gap-2 whitespace-nowrap">
                                          <p className="text-xs uppercase tracking-wide text-slate-400">Notifications</p>
                                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        {renderRulesetList(notificationsValue)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
                            <span className="whitespace-nowrap">Platform</span>
                            <select
                              className={`w-[360px] max-w-full flex-none rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
                                !agent.port || applicationLoading
                                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                  : "bg-white text-slate-900"
                              }`}
                              value={applicationValue}
                              onChange={(event) => handleApplicationChange(event.target.value)}
                              disabled={!agent.port || applicationLoading}
                            >
                              <option value="">
                                {!agent.port
                                  ? "Agent not started"
                                  : applicationLoading
                                  ? "Loading applications..."
                                  : "Select application"}
                              </option>
                              {applicationOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
                            <span className="whitespace-nowrap">Application</span>
                            <select
                              className={`w-[360px] max-w-full flex-none rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
                                !agent.port || !applicationValue || platformLoading
                                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                  : "bg-white text-slate-900"
                              }`}
                              value={platformValue}
                              onChange={(event) => handlePlatformChange(event.target.value)}
                              disabled={!agent.port || !applicationValue || platformLoading}
                            >
                              <option value="">
                                {!agent.port
                                  ? "Agent not started"
                                  : !applicationValue
                                  ? "Select application first"
                                  : platformLoading
                                  ? "Loading platforms..."
                                  : "Select platform"}
                              </option>
                              {platformOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        {platformValue && (
                          <div className="mt-6 grid justify-items-start gap-6 md:grid-cols-2">
                            <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
                              <span className="whitespace-nowrap">Ticketing Running Agent</span>
                              <select
                                className={`w-[360px] max-w-full flex-none rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
                                  ticketLoading
                                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                    : "bg-white text-slate-900"
                                }`}
                                value={ticketValue}
                                onChange={(event) => handleTicketChange(event.target.value)}
                                disabled={ticketLoading}
                              >
                                <option value="">
                                  {ticketLoading ? "Loading ticketing agents..." : "Select ticketing agent"}
                                </option>
                                {ticketOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
                              <span className="whitespace-nowrap">Frequency</span>
                              <select
                                className={`w-[360px] max-w-full flex-none rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
                                  frequencyLoading
                                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                    : "bg-white text-slate-900"
                                }`}
                                value={frequencyValue}
                                onChange={(event) => handleFrequencyChange(event.target.value)}
                                disabled={frequencyLoading}
                              >
                                <option value="">
                                  {frequencyLoading ? "Loading frequencies..." : "Select frequency"}
                                </option>
                                {frequencyOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className="flex flex-col gap-3 text-left">
                              <span className="text-sm font-semibold text-slate-600">Status</span>
                              {statusLoading ? (
                                <span className="text-xs text-slate-400">Loading status options...</span>
                              ) : statusOptions.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-start gap-4">
                                  {statusOptions.map((option) => (
                                    <label
                                      key={option.value}
                                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                                    >
                                      <span className="font-medium text-slate-700">{option.label}</span>
                                      <input
                                        type="checkbox"
                                        className="relative h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border border-slate-300 bg-white transition focus:outline-none focus:ring-2 focus:ring-slate-200 after:absolute after:left-1/2 after:top-1/2 after:h-2.5 after:w-2.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-slate-600 after:opacity-0 after:transition after:content-[''] checked:border-slate-500 checked:bg-white checked:after:opacity-100"
                                        checked={statusSelection.includes(option.value)}
                                        onChange={() => handleStatusToggle(option.value)}
                                      />
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">No status options available.</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-3 text-left">
                              <span className="text-sm font-semibold text-slate-600">Notification Agent</span>
                              {notificationLoading ? (
                                <span className="text-xs text-slate-400">Loading notification options...</span>
                              ) : notificationOptions.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-start gap-4">
                                  {notificationOptions.map((option) => (
                                    <label
                                      key={option.value}
                                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                                    >
                                      <span className="font-medium text-slate-700">{option.label}</span>
                                      <input
                                        type="checkbox"
                                        className="relative h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border border-slate-300 bg-white transition focus:outline-none focus:ring-2 focus:ring-slate-200 after:absolute after:left-1/2 after:top-1/2 after:h-2.5 after:w-2.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-slate-600 after:opacity-0 after:transition after:content-[''] checked:border-slate-500 checked:bg-white checked:after:opacity-100"
                                        checked={notificationSelection.includes(option.value)}
                                        onChange={() => handleNotificationToggle(option.value)}
                                      />
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">No notification options available.</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Tab data not exist.</p>
                )}
              </div>
            </div>
            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 pt-4">
              {settingsTab === "ruleset" && rulesetTab === "add" ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                      !agent.port ||
                      !applicationValue ||
                      !platformValue ||
                      !ticketValue ||
                      !frequencyValue ||
                      isSaving
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-red-500 text-true-white hover:bg-red-600"
                    }`}
                    onClick={handleSave}
                    disabled={
                      !agent.port ||
                      !applicationValue ||
                      !platformValue ||
                      !ticketValue ||
                      !frequencyValue ||
                      isSaving
                    }
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <div className="h-10" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
