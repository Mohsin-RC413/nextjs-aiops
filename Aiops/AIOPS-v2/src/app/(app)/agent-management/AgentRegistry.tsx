"use client";

import {
  Bot,
  BookOpen,
  ChevronDown,
  Eye,
  ListChecks,
  Pencil,
  Plus,
  Power,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AGENT_API_BASE_URL, AGENT_HOST } from "@/config/agent";
import { formatDateTime, getProviderIconSrc } from "../llm-management/llmHelpers";

type AgentRecord = {
  agentId: number;
  name: string;
  port: number | null;
  status: string;
  enterprise: string;
  start_time: string | null;
  stop_time: string | null;
  agent_id: string | null;
  description: string | null;
  instruction: string | null;
  model_id: string | null;
  modelName: string | null;
  modelProvider: string | null;
  created_at: string | null;
  updated_at: string | null;
};
type AgentRegistryProps = {
  agents: AgentRecord[];
  isLoading: boolean;
  loadError: string;
  onDeleteSuccess?: () => void | Promise<void>;
};

type SortKey = "name" | "created_at" | "updated_at" | "status";

type RulesetItem = {
  agent_id: string;
  target_type: string;
  target_value: string;
  target_name: string;
  conditions: string | string[];
  raise_ticket: string;
  notifications: string | string[];
  frequency: string;
  ruleset_id: number;
};

type SelectOption = { value: string; label: string };

type RoundedSelectProps = {
  value: string;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (value: string) => void;
};

function RoundedSelect({
  value,
  options,
  placeholder,
  disabled,
  loading,
  onChange,
}: RoundedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? "";
  const displayLabel = loading ? "Loading..." : selectedLabel || placeholder;
  const displayClass = loading || !value ? "text-[#9ca3af]" : "text-[#111827]";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled || loading) {
            return;
          }
          setIsOpen((prev) => !prev);
        }}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm outline-none transition focus-within:border-[#4f49e2] focus-within:ring-2 focus-within:ring-[#4f49e2]/20 ${
          disabled || loading
            ? "cursor-not-allowed border-[#e5e7eb] bg-[#edf0f6]"
            : "border-[#e0e5f0] bg-white"
        }`}
      >
        <span className={displayClass}>{displayLabel}</span>
        <ChevronDown className="h-4 w-4 text-[#9ca3af]" />
      </button>

      {isOpen && !disabled && !loading ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-[#6b7280] hover:bg-[#eef2ff]"
          >
            {placeholder}
          </button>
          <div className="max-h-56 overflow-auto">
            {options.map((option, index) => (
              <button
                key={`${option.value}-${index}`}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm ${
                  option.value === value
                    ? "bg-[#eef2ff] text-[#4f49e2]"
                    : "text-[#111827] hover:bg-[#f3f4f6]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AgentRegistry({
  agents,
  isLoading,
  loadError,
  onDeleteSuccess,
}: AgentRegistryProps) {
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AgentRecord | null>(null);
  const [viewTarget, setViewTarget] = useState<AgentRecord | null>(null);
  const [editTarget, setEditTarget] = useState<AgentRecord | null>(null);
  const [expandedCellKey, setExpandedCellKey] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>(
    {}
  );
  const [editTab, setEditTab] = useState<
    "rulesets" | "knowledge" | "security"
  >("rulesets");
  const [rulesetTab, setRulesetTab] = useState<"view" | "add">("view");
  const [rulesets, setRulesets] = useState<RulesetItem[]>([]);
  const [rulesetListLoading, setRulesetListLoading] = useState(false);
  const [rulesetListError, setRulesetListError] = useState("");
  const [deleteRulesetTarget, setDeleteRulesetTarget] =
    useState<RulesetItem | null>(null);
  const [isDeletingRuleset, setIsDeletingRuleset] = useState(false);
  const [platformOptions, setPlatformOptions] = useState<SelectOption[]>([]);
  const [applicationOptions, setApplicationOptions] = useState<SelectOption[]>(
    []
  );
  const [ticketOptions, setTicketOptions] = useState<SelectOption[]>([]);
  const [frequencyOptions, setFrequencyOptions] = useState<SelectOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  const [notificationOptions, setNotificationOptions] = useState<
    SelectOption[]
  >([]);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedApplication, setSelectedApplication] = useState("");
  const [selectedTicket, setSelectedTicket] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [isPlatformLoading, setIsPlatformLoading] = useState(false);
  const [isApplicationLoading, setIsApplicationLoading] = useState(false);
  const [isTicketLoading, setIsTicketLoading] = useState(false);
  const [isFrequencyLoading, setIsFrequencyLoading] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [rulesetError, setRulesetError] = useState("");
  const [isSavingRuleset, setIsSavingRuleset] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const previousAppRef = useRef<string | null>(null);

  const deleteBaseUrl = AGENT_API_BASE_URL.endsWith("/")
    ? AGENT_API_BASE_URL.slice(0, -1)
    : AGENT_API_BASE_URL;

  const clearRulesetStorage = (
    agentId: number | null | undefined,
    appNames: Array<string | null | undefined>
  ) => {
    if (!agentId) {
      return;
    }
    localStorage.removeItem(`agent-settings-application-${agentId}`);
    localStorage.removeItem(`agent-settings-platform-${agentId}`);
    const uniqueApps = Array.from(
      new Set(appNames.filter((value): value is string => Boolean(value)))
    );
    uniqueApps.forEach((appName) => {
      localStorage.removeItem(`agent-settings-ticket-${agentId}-${appName}`);
      localStorage.removeItem(`agent-settings-frequency-${agentId}-${appName}`);
      localStorage.removeItem(`agent-settings-status-${agentId}-${appName}`);
      localStorage.removeItem(
        `agent-settings-notifications-${agentId}-${appName}`
      );
    });
  };

  const handleCloseSettings = () => {
    if (editTarget) {
      clearRulesetStorage(editTarget.agentId, [
        selectedApplication,
        previousAppRef.current,
      ]);
    }
    setEditTarget(null);
  };

  const getAgentRowKey = (agent: AgentRecord, fallbackIndex: number) => {
    if (agent.agent_id) {
      return agent.agent_id;
    }
    if (agent.agentId) {
      return String(agent.agentId);
    }
    return `${agent.name}-${fallbackIndex}`;
  };

  const isOnlineStatus = (statusValue: string | null | undefined) => {
    const normalized = statusValue?.trim().toLowerCase() ?? "";
    return (
      normalized === "started" ||
      normalized === "active" ||
      normalized === "online"
    );
  };

  const formatStatusLabel = (statusValue: string | null | undefined) => {
    const normalized = statusValue?.trim();
    if (!normalized) {
      return "Offline";
    }
    return normalized
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusTone = (statusValue: string | null | undefined) => {
    const normalized = statusValue?.trim().toLowerCase() ?? "";
    if (normalized === "active" || normalized === "online" || normalized === "started") {
      return {
        text: "text-[#166534]",
        bg: "bg-[#dcfce7]",
        dot: "bg-[#16a34a]",
        border: "border-[#bbf7d0]",
      };
    }
    if (normalized === "inactive" || normalized === "offline" || normalized === "stopped") {
      return {
        text: "text-[#9a3412]",
        bg: "bg-[#ffedd5]",
        dot: "bg-[#f97316]",
        border: "border-[#fed7aa]",
      };
    }
    return {
      text: "text-[#334155]",
      bg: "bg-[#e2e8f0]",
      dot: "bg-[#64748b]",
      border: "border-[#cbd5e1]",
    };
  };

  const agentsWithLocalStatus = useMemo(
    () =>
      agents.map((agent, index) => {
        const rowKey = getAgentRowKey(agent, index);
        const localStatus = statusOverrides[rowKey];
        if (!localStatus) {
          return agent;
        }
        return { ...agent, status: localStatus };
      }),
    [agents, statusOverrides]
  );

  const filteredAgents = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const statusFiltered =
      filter === "all"
        ? agentsWithLocalStatus
        : agentsWithLocalStatus.filter((agent) =>
            filter === "online"
              ? isOnlineStatus(agent.status)
              : !isOnlineStatus(agent.status)
          );
    if (!normalizedSearch) {
      return statusFiltered;
    }
    return statusFiltered.filter((agent) =>
      [
        agent.name,
        agent.description,
        agent.modelName,
        agent.modelProvider,
        agent.instruction,
        agent.status,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [agentsWithLocalStatus, filter, searchValue]);

  const sortedAgents = useMemo(() => {
    const rows = [...filteredAgents];
    rows.sort((left, right) => {
      if (sortKey === "name") {
        const leftValue = (left.name || "").toLowerCase();
        const rightValue = (right.name || "").toLowerCase();
        const compare = leftValue.localeCompare(rightValue, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return sortDirection === "asc" ? compare : -compare;
      }

      if (sortKey === "status") {
        const leftValue = formatStatusLabel(left.status);
        const rightValue = formatStatusLabel(right.status);
        const compare = leftValue.localeCompare(rightValue, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return sortDirection === "asc" ? compare : -compare;
      }

      const leftDate =
        sortKey === "created_at" ? left.created_at : left.updated_at;
      const rightDate =
        sortKey === "created_at" ? right.created_at : right.updated_at;
      const leftTime = leftDate ? new Date(leftDate).getTime() : 0;
      const rightTime = rightDate ? new Date(rightDate).getTime() : 0;
      const leftSafe = Number.isNaN(leftTime) ? 0 : leftTime;
      const rightSafe = Number.isNaN(rightTime) ? 0 : rightTime;
      return sortDirection === "asc"
        ? leftSafe - rightSafe
        : rightSafe - leftSafe;
    });
    return rows;
  }, [filteredAgents, sortDirection, sortKey]);

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "name" || nextKey === "status" ? "asc" : "desc");
  };

  const renderTruncatedText = (
    value: string | null | undefined,
    cellKey: string
  ) => {
    const content = value?.trim() || "-";
    if (content === "-") {
      return <span className="text-[#64748b]">-</span>;
    }
    const isExpanded = expandedCellKey === cellKey;
    const shouldTruncate = content.length > 64;
    return (
      <div className="space-y-1">
        <span
          className={
            isExpanded
              ? "block break-words whitespace-normal text-[#2b3341]"
              : "block truncate text-[#2b3341]"
          }
          title={content}
        >
          {content}
        </span>
        {shouldTruncate ? (
          <button
            type="button"
            onClick={() =>
              setExpandedCellKey((previous) =>
                previous === cellKey ? null : cellKey
              )
            }
            className="text-xs font-semibold text-[#4f49e2] hover:underline"
          >
            {isExpanded ? "Show less" : "View more"}
          </button>
        ) : null}
      </div>
    );
  };

  const splitDateTime = (formattedValue: string) => {
    if (formattedValue === "-") {
      return { date: "-", time: "" };
    }
    const splitAt = formattedValue.lastIndexOf(", ");
    if (splitAt === -1) {
      return { date: formattedValue, time: "" };
    }
    return {
      date: formattedValue.slice(0, splitAt),
      time: formattedValue.slice(splitAt + 2),
    };
  };

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(sortedAgents.length / pageSize));
  const pagedAgents = sortedAgents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [agents.length, filter, searchValue, sortDirection, sortKey]);

  useEffect(() => {
    if (!editTarget) {
      setEditTab("rulesets");
      setRulesetTab("view");
      setRulesets([]);
      setRulesetListLoading(false);
      setRulesetListError("");
      setPlatformOptions([]);
      setApplicationOptions([]);
      setTicketOptions([]);
      setFrequencyOptions([]);
      setStatusOptions([]);
      setNotificationOptions([]);
      setSelectedPlatform("");
      setSelectedApplication("");
      setSelectedTicket("");
      setSelectedFrequency("");
      setSelectedStatuses([]);
      setSelectedNotifications([]);
      setIsPlatformLoading(false);
      setIsApplicationLoading(false);
      setIsTicketLoading(false);
      setIsFrequencyLoading(false);
      setIsStatusLoading(false);
      setIsNotificationLoading(false);
      setRulesetError("");
      previousAppRef.current = null;
    }
  }, [editTarget]);

  const parseRulesetArray = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return [];
  };

  useEffect(() => {
    if (!editTarget || editTab !== "rulesets" || rulesetTab !== "view") {
      return;
    }
    if (!editTarget.port) {
      setRulesetListError("Agent is not running. Start the agent to view rulesets.");
      return;
    }

    const controller = new AbortController();
    const loadRulesets = async () => {
      setRulesetListLoading(true);
      setRulesetListError("");
      try {
        const url = `${AGENT_HOST}:${editTarget.port}/agent/mule/ruleset/list/${editTarget.agentId}`;
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setRulesets(data as RulesetItem[]);
        } else {
          setRulesets([]);
          setRulesetListError("Unable to load rulesets.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setRulesets([]);
        setRulesetListError("Unable to load rulesets.");
      } finally {
        setRulesetListLoading(false);
      }
    };

    loadRulesets();
    return () => controller.abort();
  }, [editTarget, editTab, rulesetTab]);

  useEffect(() => {
    if (!isToastVisible) {
      return;
    }
    const timer = setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isToastVisible]);

  useEffect(() => {
    if (!editTarget || editTab !== "rulesets" || rulesetTab !== "add") {
      return;
    }
    if (!editTarget.port) {
      setRulesetError("Agent is not running. Start the agent to load rulesets.");
      return;
    }

    const controller = new AbortController();
    const loadPlatforms = async () => {
      setIsPlatformLoading(true);
      setRulesetError("");
      try {
        const url = `${AGENT_HOST}:${editTarget.port}/agent/mule/dropdown/target-types`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agent_id: String(editTarget.agentId) }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setPlatformOptions(data);
        } else {
          setPlatformOptions([]);
          setRulesetError("Unable to load platforms.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setPlatformOptions([]);
        setRulesetError("Unable to load platforms.");
      } finally {
        setIsPlatformLoading(false);
      }
    };

    loadPlatforms();
    return () => controller.abort();
  }, [editTarget, editTab, rulesetTab]);

  useEffect(() => {
    if (
      !editTarget ||
      !editTarget.port ||
      !selectedPlatform ||
      editTab !== "rulesets" ||
      rulesetTab !== "add"
    ) {
      setApplicationOptions([]);
      return;
    }

    const controller = new AbortController();
    const loadApplications = async () => {
      setIsApplicationLoading(true);
      setRulesetError("");
      try {
        const url = `${AGENT_HOST}:${editTarget.port}/agent/mule/dropdown/targets`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: String(editTarget.agentId),
            target_types: selectedPlatform,
          }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setApplicationOptions(data);
        } else {
          setApplicationOptions([]);
          setRulesetError("Unable to load applications.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setApplicationOptions([]);
        setRulesetError("Unable to load applications.");
      } finally {
        setIsApplicationLoading(false);
      }
    };

    loadApplications();
    return () => controller.abort();
  }, [editTarget, selectedPlatform, editTab, rulesetTab]);

  useEffect(() => {
    if (
      !editTarget ||
      !editTarget.port ||
      !selectedApplication ||
      editTab !== "rulesets" ||
      rulesetTab !== "add"
    ) {
      setTicketOptions([]);
      setFrequencyOptions([]);
      setStatusOptions([]);
      setNotificationOptions([]);
      setSelectedTicket("");
      setSelectedFrequency("");
      setSelectedStatuses([]);
      setSelectedNotifications([]);
      return;
    }

    const controller = new AbortController();
    const loadDependentOptions = async () => {
      setIsTicketLoading(true);
      setIsFrequencyLoading(true);
      setIsStatusLoading(true);
      setIsNotificationLoading(true);
      setRulesetError("");
      try {
        const statusUrl = `${AGENT_HOST}:${editTarget.port}/agent/mule/dropdown/status`;
        const ticketUrl = `${AGENT_HOST}:${editTarget.port}/agent/mule/dropdown/ticket`;
        const frequencyUrl = `${AGENT_HOST}:${editTarget.port}/agent/mule/dropdown/frequency`;
        const notificationsUrl = `${AGENT_HOST}:${editTarget.port}/agent/mule/dropdown/notifications`;
        const body = JSON.stringify({
          agent_id: String(editTarget.agentId),
          app_name: selectedApplication,
        });
        const headers = {
          accept: "application/json",
          "Content-Type": "application/json",
        };

        const [statusRes, ticketRes, freqRes, notifRes] = await Promise.all([
          fetch(statusUrl, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          }),
          fetch(ticketUrl, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          }),
          fetch(frequencyUrl, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          }),
          fetch(notificationsUrl, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          }),
        ]);

        const [statusData, ticketData, freqData, notifData] =
          await Promise.all([
            statusRes.json(),
            ticketRes.json(),
            freqRes.json(),
            notifRes.json(),
          ]);

        setStatusOptions(
          statusRes.ok && Array.isArray(statusData) ? statusData : []
        );
        setTicketOptions(
          ticketRes.ok && Array.isArray(ticketData) ? ticketData : []
        );
        setFrequencyOptions(
          freqRes.ok && Array.isArray(freqData) ? freqData : []
        );
        setNotificationOptions(
          notifRes.ok && Array.isArray(notifData) ? notifData : []
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setStatusOptions([]);
        setTicketOptions([]);
        setFrequencyOptions([]);
        setNotificationOptions([]);
        setRulesetError("Unable to load ruleset options.");
      } finally {
        setIsTicketLoading(false);
        setIsFrequencyLoading(false);
        setIsStatusLoading(false);
        setIsNotificationLoading(false);
      }
    };

    loadDependentOptions();
    return () => controller.abort();
  }, [editTarget, selectedApplication, editTab, rulesetTab]);

  const agentCount = agents.length;

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const agentId = deleteTarget.agentId;
      const url = `${deleteBaseUrl}/aiops/agent/delete/${encodeURIComponent(
        agentId
      )}?agentId=${encodeURIComponent(agentId)}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { accept: "application/json" },
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("Agent delete response:", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (response.ok) {
        setDeleteTarget(null);
        await onDeleteSuccess?.();
        return;
      }

      const message =
        typeof data === "object" && data && "message" in data
          ? String((data as { message?: string }).message)
          : "Unable to delete agent.";
      setDeleteError(message);
    } catch {
      setDeleteError("Unable to delete agent.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveRuleset = async () => {
    if (
      !editTarget ||
      !editTarget.port ||
      editTab !== "rulesets" ||
      rulesetTab !== "add" ||
      isSavingRuleset
    ) {
      return;
    }

    if (!selectedPlatform || !selectedApplication) {
      setRulesetError("Select platform and application before saving.");
      return;
    }

    setIsSavingRuleset(true);
    setRulesetError("");

    try {
      const url = `${AGENT_HOST}:${editTarget.port}/agent/mule/ruleset/save`;
      const payload = {
        agent_id: String(editTarget.agentId),
        target_type: selectedPlatform,
        target_value: selectedApplication,
        target_name: selectedApplication,
        conditions: selectedStatuses,
        raise_ticket: selectedTicket || "",
        notifications: selectedNotifications,
        frequency: selectedFrequency || "",
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("Ruleset save response:", {
        ok: response.ok,
        status: response.status,
        data,
        payload,
      });

      const isSuccess =
        response.ok &&
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        String((data as { status?: string }).status).toUpperCase() ===
          "SUCCESS";

      if (isSuccess) {
        clearRulesetStorage(editTarget.agentId, [
          selectedApplication,
          previousAppRef.current,
        ]);
        setToastMessage("Ruleset Added Successfully");
        setIsToastVisible(true);
        setRulesetTab("view");
        setSelectedPlatform("");
        setSelectedApplication("");
        setSelectedTicket("");
        setSelectedFrequency("");
        setSelectedStatuses([]);
        setSelectedNotifications([]);
        setPlatformOptions([]);
        setApplicationOptions([]);
        setTicketOptions([]);
        setFrequencyOptions([]);
        setStatusOptions([]);
        setNotificationOptions([]);
        previousAppRef.current = null;
        return;
      }

      if (!response.ok) {
        setRulesetError("Unable to save ruleset.");
        return;
      }
      setRulesetError("Unable to save ruleset.");
    } catch (error) {
      console.error("Ruleset save error:", error);
      setRulesetError("Unable to save ruleset.");
    } finally {
      setIsSavingRuleset(false);
    }
  };

  const handleConfirmDeleteRuleset = async () => {
    if (
      !deleteRulesetTarget ||
      !editTarget ||
      !editTarget.port ||
      isDeletingRuleset
    ) {
      return;
    }

    setIsDeletingRuleset(true);
    setRulesetError("");

    try {
      const url = `${AGENT_HOST}:${editTarget.port}/agent/mule/ruleset/delete`;
      const payload = {
        agent_id: String(editTarget.agentId),
        ruleset_id: String(deleteRulesetTarget.ruleset_id),
      };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("Ruleset delete response:", {
        ok: response.ok,
        status: response.status,
        data,
        payload,
      });

      const isSuccess =
        response.ok &&
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        String((data as { status?: string }).status).toUpperCase() ===
          "SUCCESS";

      if (isSuccess) {
        setRulesets((prev) =>
          prev.filter(
            (item) => item.ruleset_id !== deleteRulesetTarget.ruleset_id
          )
        );
        setToastMessage("Ruleset Deleted Successfully");
        setIsToastVisible(true);
        setDeleteRulesetTarget(null);
        return;
      }

      setRulesetError("Unable to delete ruleset.");
    } catch (error) {
      console.error("Ruleset delete error:", error);
      setRulesetError("Unable to delete ruleset.");
    } finally {
      setIsDeletingRuleset(false);
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[#111827]">
            Agent Registry
          </h3>
          <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
            {agentCount}
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
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search Agents.."
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
              onClick={() => setFilter("online")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                filter === "online"
                  ? "bg-[#4f49e2] text-white"
                  : "border border-[#e0e5f0] text-[#111827]"
              }`}
            >
              Online
            </button>
            <button
              type="button"
              onClick={() => setFilter("offline")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                filter === "offline"
                  ? "bg-[#4f49e2] text-white"
                  : "border border-[#e0e5f0] text-[#111827]"
              }`}
            >
              Offline
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#eef1f7]">
        {isLoading ? (
          <div className="bg-white">
            <div className="hidden grid-cols-[1.1fr_1.2fr_1.5fr_1.4fr_0.9fr_0.9fr_0.8fr_0.9fr] bg-[#eaf0f8] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#0f172a] md:grid">
              <span>Name</span>
              <span>Description</span>
              <span>Model name</span>
              <span>Instructions</span>
              <span>Created at</span>
              <span>Updated at</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            <div className="hidden divide-y divide-[#eef1f7] md:block">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`desktop-skeleton-${index}`}
                  className="grid animate-pulse grid-cols-[1.1fr_1.2fr_1.5fr_1.4fr_0.9fr_0.9fr_0.8fr_0.9fr] items-center px-4 py-3"
                >
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <span
                      key={`desktop-skeleton-cell-${index}-${cellIndex}`}
                      className="mr-3 h-4 rounded bg-[#edf2f9]"
                    />
                  ))}
                  <span className="ml-auto h-8 w-24 rounded-lg bg-[#edf2f9]" />
                </div>
              ))}
            </div>
            <div className="divide-y divide-[#eef1f7] md:hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`mobile-skeleton-${index}`}
                  className="animate-pulse space-y-3 px-4 py-4"
                >
                  <div className="h-4 w-2/5 rounded bg-[#edf2f9]" />
                  <div className="h-3 w-full rounded bg-[#edf2f9]" />
                  <div className="h-3 w-4/5 rounded bg-[#edf2f9]" />
                  <div className="h-8 w-full rounded-xl bg-[#edf2f9]" />
                </div>
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fee2e2] text-[#ef4444] shadow-[0_12px_24px_-20px_rgba(239,68,68,0.55)]">
              <Bot className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[#111827]">
              Unable to load agents
            </p>
            <p className="text-sm text-[#6b7280]">{loadError}</p>
          </div>
        ) : sortedAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2] shadow-[0_12px_24px_-20px_rgba(79,73,226,0.8)]">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-[#111827]">
                {agents.length === 0 && filter === "all"
                  ? "No agents yet"
                  : filter === "online"
                    ? "No Online agents yet"
                    : filter === "offline"
                      ? "No Offline agents yet"
                      : "No agents found"}
              </p>
              {agents.length === 0 && filter === "all" ? (
                <p className="text-sm text-[#6b7280]">
                  Create one to start monitoring and automating tasks.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="grid grid-cols-[1.1fr_1.2fr_1.5fr_1.4fr_0.9fr_0.9fr_0.8fr_0.9fr] divide-x divide-[#d7e0ee] bg-[#eaf0f8] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#0f172a]">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="inline-flex w-full items-center justify-center gap-1 px-3 text-center leading-tight whitespace-normal break-words transition hover:text-[#4f49e2]"
                >
                  Name
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${
                      sortKey === "name"
                        ? `${sortDirection === "asc" ? "rotate-180" : ""} text-[#4f49e2]`
                        : "text-[#94a3b8]"
                    }`}
                  />
                </button>
                <span className="px-3 text-center leading-tight whitespace-normal break-words">
                  Description
                </span>
                <span className="px-3 text-center leading-tight whitespace-normal break-words">
                  Model name
                </span>
                <span className="px-3 text-center leading-tight whitespace-normal break-words">
                  Instructions
                </span>
                <button
                  type="button"
                  onClick={() => handleSort("created_at")}
                  className="inline-flex w-full items-center justify-center gap-1 px-3 text-center leading-tight whitespace-normal break-words transition hover:text-[#4f49e2]"
                >
                  Created at
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${
                      sortKey === "created_at"
                        ? `${sortDirection === "asc" ? "rotate-180" : ""} text-[#4f49e2]`
                        : "text-[#94a3b8]"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("updated_at")}
                  className="inline-flex w-full items-center justify-center gap-1 px-3 text-center leading-tight whitespace-normal break-words transition hover:text-[#4f49e2]"
                >
                  Updated at
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${
                      sortKey === "updated_at"
                        ? `${sortDirection === "asc" ? "rotate-180" : ""} text-[#4f49e2]`
                        : "text-[#94a3b8]"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="inline-flex w-full items-center justify-center gap-1 px-3 text-center leading-tight whitespace-normal break-words transition hover:text-[#4f49e2]"
                >
                  Status
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${
                      sortKey === "status"
                        ? `${sortDirection === "asc" ? "rotate-180" : ""} text-[#4f49e2]`
                        : "text-[#94a3b8]"
                    }`}
                  />
                </button>
                <span className="px-3 text-center leading-tight whitespace-normal break-words">
                  Action
                </span>
              </div>
              <div className="divide-y divide-[#eef1f7] bg-white">
                {pagedAgents.map((agent, index) => {
                  const rowKey = getAgentRowKey(agent, index);
                  const modelName = agent.modelName || agent.model_id || "-";
                  const providerValue = agent.modelProvider || "-";
                  const providerIcon = getProviderIconSrc(agent.modelProvider);
                  const createdAt = formatDateTime(agent.created_at);
                  const updatedAt = formatDateTime(agent.updated_at);
                  const createdDateParts = splitDateTime(createdAt);
                  const updatedDateParts = splitDateTime(updatedAt);
                  const statusLabel = formatStatusLabel(agent.status);
                  const statusTone = getStatusTone(agent.status);
                  const nextStatus = isOnlineStatus(agent.status)
                    ? "inactive"
                    : "active";
                  return (
                    <div
                      key={`desktop-row-${rowKey}`}
                      className="grid grid-cols-[1.1fr_1.2fr_1.5fr_1.4fr_0.9fr_0.9fr_0.8fr_0.9fr] items-center divide-x divide-[#e8eef7] px-4 py-3 text-sm text-[#2b3341] transition-colors hover:bg-[#f8fbff]"
                    >
                      <span className="truncate px-3 font-semibold text-[#0f172a]" title={agent.name || "-"}>
                        {agent.name || "-"}
                      </span>
                      <div className="px-3">
                        {renderTruncatedText(agent.description, `desc-${rowKey}`)}
                      </div>
                      <span className="min-w-0 px-3">
                        <span className="inline-flex max-w-full items-center gap-3">
                          {providerIcon ? (
                            <Image
                              src={providerIcon}
                              alt={`${providerValue} logo`}
                              width={20}
                              height={20}
                              className="h-5 w-5 flex-none object-contain"
                            />
                          ) : (
                            <span className="h-5 w-5 flex-none rounded-full bg-[#e2e8f0]" />
                          )}
                          <span className="min-w-0">
                            <span
                              className="block truncate font-semibold text-[#0f172a]"
                              title={modelName}
                            >
                              {modelName}
                            </span>
                            <span
                              className="block truncate text-[11px] uppercase tracking-[0.08em] text-[#64748b]"
                              title={providerValue}
                            >
                              {providerValue}
                            </span>
                          </span>
                        </span>
                      </span>
                      <div className="px-3">
                        {renderTruncatedText(
                          agent.instruction,
                          `instruction-${rowKey}`
                        )}
                      </div>
                      <span className="min-w-0 px-3 text-center text-[#334155]" title={agent.created_at || "-"}>
                        <span className="block leading-tight">
                          {createdDateParts.date}
                        </span>
                        {createdDateParts.time ? (
                          <span className="mt-0.5 block text-xs leading-tight text-[#64748b]">
                            {createdDateParts.time}
                          </span>
                        ) : null}
                      </span>
                      <span className="min-w-0 px-3 text-center text-[#334155]" title={agent.updated_at || "-"}>
                        <span className="block leading-tight">
                          {updatedDateParts.date}
                        </span>
                        {updatedDateParts.time ? (
                          <span className="mt-0.5 block text-xs leading-tight text-[#64748b]">
                            {updatedDateParts.time}
                          </span>
                        ) : null}
                      </span>
                      <span className="px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone.bg} ${statusTone.text} ${statusTone.border}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
                          {statusLabel}
                        </span>
                      </span>
                      <div className="flex items-center justify-end gap-1.5 px-3">
                        <button
                          type="button"
                          onClick={() => setViewTarget(agent)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#475569] transition hover:bg-[#eef2ff] hover:text-[#4f49e2]"
                          title="View details"
                          aria-label={`View ${agent.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTarget(agent)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#475569] transition hover:bg-[#eef2ff] hover:text-[#4f49e2]"
                          title="Edit settings"
                          aria-label={`Edit ${agent.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setStatusOverrides((previous) => ({
                              ...previous,
                              [rowKey]: nextStatus,
                            }))
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#475569] transition hover:bg-[#fff7ed] hover:text-[#c2410c]"
                          title={
                            isOnlineStatus(agent.status)
                              ? "Mark as inactive"
                              : "Mark as active"
                          }
                          aria-label={`Toggle status for ${agent.name}`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-[#eef1f7] bg-white md:hidden">
              {pagedAgents.map((agent, index) => {
                const rowKey = getAgentRowKey(agent, index);
                const modelName = agent.modelName || agent.model_id || "-";
                const providerValue = agent.modelProvider || "-";
                const providerIcon = getProviderIconSrc(agent.modelProvider);
                const createdAt = formatDateTime(agent.created_at);
                const updatedAt = formatDateTime(agent.updated_at);
                const statusLabel = formatStatusLabel(agent.status);
                const statusTone = getStatusTone(agent.status);
                const nextStatus = isOnlineStatus(agent.status)
                  ? "inactive"
                  : "active";
                return (
                  <div
                    key={`mobile-row-${rowKey}`}
                    className="space-y-3 px-4 py-4 text-sm text-[#2b3341]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#0f172a]">
                          {agent.name || "-"}
                        </p>
                        <p className="mt-1 text-xs text-[#64748b]">
                          {createdAt} updated {updatedAt}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone.bg} ${statusTone.text} ${statusTone.border}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
                        {statusLabel}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                        Description
                      </p>
                      <div className="mt-1">
                        {renderTruncatedText(agent.description, `mobile-desc-${rowKey}`)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e6ebf5] bg-[#f8fafc] px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                        Model
                      </p>
                      <div className="mt-2 inline-flex max-w-full items-center gap-3">
                        {providerIcon ? (
                          <Image
                            src={providerIcon}
                            alt={`${providerValue} logo`}
                            width={20}
                            height={20}
                            className="h-5 w-5 flex-none object-contain"
                          />
                        ) : (
                          <span className="h-5 w-5 flex-none rounded-full bg-[#e2e8f0]" />
                        )}
                        <span className="min-w-0 text-left">
                          <span className="block truncate font-semibold text-[#0f172a]">
                            {modelName}
                          </span>
                          <span className="block truncate text-[11px] uppercase tracking-[0.08em] text-[#64748b]">
                            {providerValue}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                        Instructions
                      </p>
                      <div className="mt-1">
                        {renderTruncatedText(
                          agent.instruction,
                          `mobile-instruction-${rowKey}`
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setViewTarget(agent)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#dce3f1] px-3 py-2 text-xs font-semibold text-[#334155] transition hover:bg-[#eef2ff] hover:text-[#4f49e2]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditTarget(agent)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#dce3f1] px-3 py-2 text-xs font-semibold text-[#334155] transition hover:bg-[#eef2ff] hover:text-[#4f49e2]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStatusOverrides((previous) => ({
                            ...previous,
                            [rowKey]: nextStatus,
                          }))
                        }
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#dce3f1] px-3 py-2 text-xs font-semibold text-[#334155] transition hover:bg-[#fff7ed] hover:text-[#c2410c]"
                      >
                        <Power className="h-3.5 w-3.5" />
                        {isOnlineStatus(agent.status) ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-[#eef1f7] bg-white px-4 py-3 text-sm text-[#6b7280]">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    currentPage === 1
                      ? "cursor-not-allowed border-[#e5e7eb] text-[#9ca3af]"
                      : "border-[#e0e5f0] text-[#111827] hover:bg-[#eef2ff]"
                  }`}
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-[#6b7280]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    currentPage === totalPages
                      ? "cursor-not-allowed border-[#e5e7eb] text-[#9ca3af]"
                      : "border-[#e0e5f0] text-[#111827] hover:bg-[#eef2ff]"
                  }`}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {viewTarget ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between border-b border-[#eef1f7] px-6 py-4">
              <h4 className="text-lg font-semibold text-[#0f172a]">
                Agent details
              </h4>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5f9] text-[#0f172a]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-5 px-6 py-5 text-sm text-[#334155]">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    Name
                  </p>
                  <p className="mt-1 font-semibold text-[#0f172a]">
                    {viewTarget.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    Status
                  </p>
                  <p className="mt-1 font-semibold text-[#0f172a]">
                    {formatStatusLabel(viewTarget.status)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                  Description
                </p>
                <p className="mt-1 break-words whitespace-normal">
                  {viewTarget.description || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                  Instructions
                </p>
                <p className="mt-1 break-words whitespace-normal">
                  {viewTarget.instruction || "-"}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    Model
                  </p>
                  <p className="mt-1 break-words whitespace-normal">
                    {viewTarget.modelName || viewTarget.model_id || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    Provider
                  </p>
                  <p className="mt-1 break-words whitespace-normal">
                    {viewTarget.modelProvider || "-"}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    Created at
                  </p>
                  <p className="mt-1">{formatDateTime(viewTarget.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    Updated at
                  </p>
                  <p className="mt-1">{formatDateTime(viewTarget.updated_at)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end border-t border-[#eef1f7] px-6 py-4">
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="rounded-xl border border-[#dce3f1] px-5 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between border-b border-[#fee2e2] bg-[#fff5f5] px-6 py-4">
              <div className="flex items-center gap-2 text-[#b91c1c]">
                <Trash2 className="h-5 w-5" />
                <h4 className="text-lg font-semibold">Delete Agent</h4>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#b91c1c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#374151]">
                Are you sure you want to delete{" "}
                <span className="rounded-md bg-[#fee2e2] px-2 py-0.5 font-semibold text-[#b91c1c]">
                  {deleteTarget.name}
                </span>
                ?
              </p>
              <p className="mt-3 text-xs text-[#9b1c1c]">
                This action can’t be undone.
              </p>
              {deleteError ? (
                <p className="mt-3 text-sm text-[#dc2626]">{deleteError}</p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#eef1f7] px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-18px_rgba(239,68,68,0.8)] ${
                  isDeleting
                    ? "cursor-not-allowed bg-[#fca5a5]"
                    : "bg-[#ef4444] hover:bg-[#dc2626]"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between bg-[#4f49e2] px-6 py-4 text-white">
              <h4 className="text-lg font-semibold">Agent settings</h4>
              <button
                type="button"
                onClick={handleCloseSettings}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {editTarget.name}
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Rulesets: {rulesets.length}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setEditTab("rulesets")}
                  className={`flex items-center gap-2 border-b-2 pb-2 ${
                    editTab === "rulesets"
                      ? "border-[#4f49e2] text-[#4f49e2]"
                      : "border-transparent text-[#6b7280]"
                  }`}
                >
                  <ListChecks className="h-4 w-4" />
                  Rulesets
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab("knowledge")}
                  className={`flex items-center gap-2 border-b-2 pb-2 ${
                    editTab === "knowledge"
                      ? "border-[#4f49e2] text-[#4f49e2]"
                      : "border-transparent text-[#6b7280]"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Knowledge Base
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab("security")}
                  className={`flex items-center gap-2 border-b-2 pb-2 ${
                    editTab === "security"
                      ? "border-[#4f49e2] text-[#4f49e2]"
                      : "border-transparent text-[#6b7280]"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Security
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-[#eef1f7] bg-white p-6 shadow-[0_12px_30px_-28px_rgba(16,24,40,0.35)]">
                {editTab === "rulesets" ? (
                  <>
                    <div className="flex items-center gap-4 text-sm font-semibold">
                      <button
                        type="button"
                        onClick={() => setRulesetTab("view")}
                        className={`flex items-center gap-2 border-b-2 pb-2 ${
                          rulesetTab === "view"
                            ? "border-[#4f49e2] text-[#4f49e2]"
                            : "border-transparent text-[#6b7280]"
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        View Rulesets
                      </button>
                      <button
                        type="button"
                        onClick={() => setRulesetTab("add")}
                        className={`flex items-center gap-2 border-b-2 pb-2 ${
                          rulesetTab === "add"
                            ? "border-[#4f49e2] text-[#4f49e2]"
                            : "border-transparent text-[#6b7280]"
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                        Add Rulesets
                      </button>
                    </div>

                    {rulesetTab === "view" ? (
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-sm font-semibold text-[#111827]">
                          <span>Saved rulesets</span>
                          <span className="text-[#6b7280]">
                            {rulesets.length} total
                          </span>
                        </div>
                        {rulesetListLoading ? (
                          <div className="mt-4 rounded-2xl border border-[#eef1f7] bg-white px-4 py-8 text-center text-sm text-[#6b7280]">
                            Loading rulesets...
                          </div>
                        ) : rulesetListError ? (
                          <div className="mt-4 rounded-2xl border border-[#fee2e2] bg-[#fff5f5] px-4 py-6 text-sm text-[#b91c1c]">
                            {rulesetListError}
                          </div>
                        ) : rulesets.length === 0 ? (
                          <div className="mt-4 rounded-2xl border border-[#eef1f7] bg-white px-4 py-10 text-center text-sm text-[#6b7280]">
                            <p className="font-semibold text-[#111827]">
                              No rulesets
                            </p>
                            <p className="mt-1">
                              No rulesets to show yet. Switch to Add Ruleset to
                              create your first one.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 space-y-4">
                            {rulesets.map((ruleset, index) => {
                              const conditions = parseRulesetArray(
                                ruleset.conditions
                              ).join(", ");
                              const notifications = parseRulesetArray(
                                ruleset.notifications
                              ).join(", ");
                              return (
                                <div
                                  key={ruleset.ruleset_id ?? index}
                                  className="rounded-2xl border border-[#eef1f7] bg-white px-5 py-4 text-sm text-[#2b3341]"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-xs text-[#6b7280]">
                                        Ruleset {index + 1}
                                      </p>
                                      <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="text-base font-semibold text-[#111827]">
                                          {ruleset.target_name}
                                        </span>
                                        <span className="text-sm text-[#6b7280]">
                                          {ruleset.target_type}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteRulesetTarget(ruleset)
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffe4e6] text-[#ef4444]"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold uppercase text-[#6b7280]">
                                        Platform
                                      </p>
                                      <p className="font-semibold text-[#111827]">
                                        {ruleset.target_type}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold uppercase text-[#6b7280]">
                                        Application
                                      </p>
                                      <p className="font-semibold text-[#111827]">
                                        {ruleset.target_value}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold uppercase text-[#6b7280]">
                                        Ticketing Running Agent
                                      </p>
                                      <p className="font-semibold text-[#111827]">
                                        {ruleset.raise_ticket}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold uppercase text-[#6b7280]">
                                        Frequency
                                      </p>
                                      <p className="font-semibold text-[#111827]">
                                        {ruleset.frequency}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold uppercase text-[#6b7280]">
                                        Conditions
                                      </p>
                                      <p className="font-semibold text-[#111827]">
                                        {conditions || "—"}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold uppercase text-[#6b7280]">
                                        Notifications
                                      </p>
                                      <p className="font-semibold text-[#111827]">
                                        {notifications || "—"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-[#eef1f7] bg-white px-6 py-6">
                        {rulesetError ? (
                          <p className="mb-4 text-sm text-[#dc2626]">
                            {rulesetError}
                          </p>
                        ) : null}
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="text-sm font-semibold text-[#111827]">
                            <span>Platform</span>
                            <div className="mt-2">
                              <RoundedSelect
                                value={selectedPlatform}
                                options={platformOptions}
                                placeholder="Select Platform"
                                loading={isPlatformLoading}
                                onChange={(value) => {
                                  setSelectedPlatform(value);
                                  setSelectedApplication("");
                                  setApplicationOptions([]);
                                  setTicketOptions([]);
                                  setFrequencyOptions([]);
                                  setStatusOptions([]);
                                  setNotificationOptions([]);
                                  setSelectedTicket("");
                                  setSelectedFrequency("");
                                  setSelectedStatuses([]);
                                  setSelectedNotifications([]);
                                  if (previousAppRef.current) {
                                    localStorage.removeItem(
                                      `agent-settings-ticket-${editTarget?.agentId}-${previousAppRef.current}`
                                    );
                                    localStorage.removeItem(
                                      `agent-settings-frequency-${editTarget?.agentId}-${previousAppRef.current}`
                                    );
                                    localStorage.removeItem(
                                      `agent-settings-status-${editTarget?.agentId}-${previousAppRef.current}`
                                    );
                                    localStorage.removeItem(
                                      `agent-settings-notifications-${editTarget?.agentId}-${previousAppRef.current}`
                                    );
                                  }
                                  previousAppRef.current = null;
                                  if (value) {
                                    localStorage.setItem(
                                      `agent-settings-application-${editTarget?.agentId}`,
                                      value
                                    );
                                  } else {
                                    localStorage.removeItem(
                                      `agent-settings-application-${editTarget?.agentId}`
                                    );
                                  }
                                  localStorage.removeItem(
                                    `agent-settings-platform-${editTarget?.agentId}`
                                  );
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-[#111827]">
                            <span>Application</span>
                            <div className="mt-2">
                              <RoundedSelect
                                value={selectedApplication}
                                options={applicationOptions}
                                placeholder={
                                  selectedPlatform
                                    ? "Select application"
                                    : "Select application first"
                                }
                                disabled={!selectedPlatform}
                                loading={isApplicationLoading}
                                onChange={(value) => {
                                  setSelectedApplication(value);
                                  setSelectedTicket("");
                                  setSelectedFrequency("");
                                  setSelectedStatuses([]);
                                  setSelectedNotifications([]);
                                  if (previousAppRef.current) {
                                    localStorage.removeItem(
                                      `agent-settings-ticket-${editTarget?.agentId}-${previousAppRef.current}`
                                    );
                                    localStorage.removeItem(
                                      `agent-settings-frequency-${editTarget?.agentId}-${previousAppRef.current}`
                                    );
                                    localStorage.removeItem(
                                      `agent-settings-status-${editTarget?.agentId}-${previousAppRef.current}`
                                    );
                                    localStorage.removeItem(
                                      `agent-settings-notifications-${editTarget?.agentId}-${previousAppRef.current}`
                                    );
                                  }
                                  previousAppRef.current = value || null;
                                  if (value) {
                                    localStorage.setItem(
                                      `agent-settings-platform-${editTarget?.agentId}`,
                                      value
                                    );
                                  } else {
                                    localStorage.removeItem(
                                      `agent-settings-platform-${editTarget?.agentId}`
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-6 md:grid-cols-2">
                          <div className="text-sm font-semibold text-[#111827]">
                            <span>Ticketing Running Agent</span>
                            <div className="mt-2">
                              <RoundedSelect
                                value={selectedTicket}
                                options={ticketOptions}
                                placeholder={
                                  selectedApplication
                                    ? "Select ticketing agent"
                                    : "Select application first"
                                }
                                disabled={!selectedApplication}
                                loading={isTicketLoading}
                                onChange={(value) => {
                                  setSelectedTicket(value);
                                  if (value && editTarget && selectedApplication) {
                                    localStorage.setItem(
                                      `agent-settings-ticket-${editTarget.agentId}-${selectedApplication}`,
                                      value
                                    );
                                  } else if (editTarget && selectedApplication) {
                                    localStorage.removeItem(
                                      `agent-settings-ticket-${editTarget.agentId}-${selectedApplication}`
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-[#111827]">
                            <span>Frequency</span>
                            <div className="mt-2">
                              <RoundedSelect
                                value={selectedFrequency}
                                options={frequencyOptions}
                                placeholder={
                                  selectedApplication
                                    ? "Select frequency"
                                    : "Select application first"
                                }
                                disabled={!selectedApplication}
                                loading={isFrequencyLoading}
                                onChange={(value) => {
                                  setSelectedFrequency(value);
                                  if (value && editTarget && selectedApplication) {
                                    localStorage.setItem(
                                      `agent-settings-frequency-${editTarget.agentId}-${selectedApplication}`,
                                      value
                                    );
                                  } else if (editTarget && selectedApplication) {
                                    localStorage.removeItem(
                                      `agent-settings-frequency-${editTarget.agentId}-${selectedApplication}`
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-6 md:grid-cols-2">
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              Status
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#111827]">
                              {statusOptions.map((option) => {
                                const isChecked = selectedStatuses.includes(
                                  option.value
                                );
                                return (
                                  <label
                                    key={option.value}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(event) => {
                                        const next = event.target.checked
                                          ? [...selectedStatuses, option.value]
                                          : selectedStatuses.filter(
                                              (item) => item !== option.value
                                            );
                                        setSelectedStatuses(next);
                                        if (
                                          editTarget &&
                                          selectedApplication
                                        ) {
                                          localStorage.setItem(
                                            `agent-settings-status-${editTarget.agentId}-${selectedApplication}`,
                                            JSON.stringify(next)
                                          );
                                        }
                                      }}
                                      className="h-4 w-4 rounded border-[#d1d5db] text-[#4f49e2] focus:ring-[#c7c4f7]"
                                    />
                                    {option.label}
                                  </label>
                                );
                              })}
                              {statusOptions.length === 0 && !isStatusLoading ? (
                                <span className="text-xs text-[#94a3b8]">
                                  No status options.
                                </span>
                              ) : null}
                              {isStatusLoading ? (
                                <span className="text-xs text-[#94a3b8]">
                                  Loading status...
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              Notification Agent
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#111827]">
                              {notificationOptions.map((option) => {
                                const isChecked =
                                  selectedNotifications.includes(option.value);
                                return (
                                  <label
                                    key={option.value}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(event) => {
                                        const next = event.target.checked
                                          ? [
                                              ...selectedNotifications,
                                              option.value,
                                            ]
                                          : selectedNotifications.filter(
                                              (item) => item !== option.value
                                            );
                                        setSelectedNotifications(next);
                                        if (
                                          editTarget &&
                                          selectedApplication
                                        ) {
                                          localStorage.setItem(
                                            `agent-settings-notifications-${editTarget.agentId}-${selectedApplication}`,
                                            JSON.stringify(next)
                                          );
                                        }
                                      }}
                                      className="h-4 w-4 rounded border-[#d1d5db] text-[#4f49e2] focus:ring-[#c7c4f7]"
                                    />
                                    {option.label}
                                  </label>
                                );
                              })}
                              {notificationOptions.length === 0 &&
                              !isNotificationLoading ? (
                                <span className="text-xs text-[#94a3b8]">
                                  No notification options.
                                </span>
                              ) : null}
                              {isNotificationLoading ? (
                                <span className="text-xs text-[#94a3b8]">
                                  Loading notifications...
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#e0e5f0] bg-[#f9fafb] px-4 py-10 text-center text-sm text-[#6b7280]">
                    No data available.
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#eef1f7] px-6 py-4">
              <button
                type="button"
                onClick={handleCloseSettings}
                className="rounded-xl border border-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#4f49e2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRuleset}
                disabled={isSavingRuleset}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white ${
                  isSavingRuleset
                    ? "cursor-not-allowed bg-[#c7c4f7]"
                    : "bg-[#4f49e2] shadow-[0_10px_24px_-18px_rgba(79,73,226,0.9)]"
                }`}
              >
                {isSavingRuleset ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteRulesetTarget ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between border-b border-[#eef1f7] px-6 py-4">
              <h4 className="text-lg font-semibold text-[#111827]">
                Delete Ruleset
              </h4>
              <button
                type="button"
                onClick={() => setDeleteRulesetTarget(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#374151]">
                Are you sure you want to delete this ruleset?
              </p>
              {rulesetError ? (
                <p className="mt-3 text-sm text-[#dc2626]">{rulesetError}</p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#eef1f7] px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteRulesetTarget(null)}
                className="rounded-xl border border-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#374151]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRuleset}
                disabled={isDeletingRuleset}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white ${
                  isDeletingRuleset
                    ? "cursor-not-allowed bg-[#fca5a5]"
                    : "bg-[#ef4444] shadow-[0_10px_24px_-18px_rgba(239,68,68,0.8)] hover:bg-[#dc2626]"
                }`}
              >
                {isDeletingRuleset ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isToastVisible ? (
        <div className="fixed bottom-6 right-6 z-[80]">
          <div className="toast-fade relative rounded-2xl bg-[#4f49e2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(79,73,226,0.8)]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-white/60">
                <span className="toast-dot-fill absolute inset-0 rounded-full bg-white" />
              </span>
              <span>{toastMessage}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl bg-white/25">
              <span className="toast-progress-bar block h-full w-full bg-white/70" />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
