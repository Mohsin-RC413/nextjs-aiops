"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Bot,
  ChevronDown,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { LLM_MANAGER_API_BASE_URL } from "@/config/agent";

type LLMRecord = Record<string, string | number | boolean | null>;

const PROVIDER_MODELS = {
  google: [
    "gemini-3-flash-preview",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ],
  anthropic: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "claude-opus-4-6",
  ],
  groq: [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "moonshotai/kimi-k2-instruct-0905",
  ],
  bedrock: [
    "global.anthropic.claude-haiku-4-5-20251001-v1:0",
    "global.anthropic.claude-sonnet-4-6",
    "global.amazon.nova-2-lite-v1:0",
  ],
} as const;

type ProviderKey = keyof typeof PROVIDER_MODELS;
type SelectOption = { value: string; label: string; iconSrc?: string };
const SORTABLE_HEADERS = ["model_id", "provider", "created_at"] as const;
type SortableHeader = (typeof SORTABLE_HEADERS)[number];

type RoundedSelectProps = {
  value: string;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  leadingIconSrc?: string;
  leadingIconAlt?: string;
  onChange: (value: string) => void;
};

const LLM_API_BASE = LLM_MANAGER_API_BASE_URL.endsWith("/")
  ? LLM_MANAGER_API_BASE_URL.slice(0, -1)
  : LLM_MANAGER_API_BASE_URL;
const LLM_LIST_URL = `${LLM_API_BASE}/llms/`;
const LLM_CREATE_URL = `${LLM_API_BASE}/llms/`;

const normalizeLlmRecord = (value: unknown): LLMRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const normalized: LLMRecord = {};
  for (const [key, rawValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean" ||
      rawValue === null
    ) {
      normalized[key] = rawValue;
      continue;
    }

    if (rawValue === undefined) {
      normalized[key] = null;
      continue;
    }

    normalized[key] = JSON.stringify(rawValue);
  }

  return normalized;
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }
  return fallback;
};

const formatCellValue = (
  value: string | number | boolean | null | undefined
) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
};

const toIdentifierPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const buildModelId = (provider: string, name: string) =>
  `${toIdentifierPart(provider)}_${toIdentifierPart(name)}`;

const toLabel = (value: string) =>
  value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;

const DESCRIPTION_MIN_LENGTH = 10;

const formatHeaderLabel = (header: string) =>
  header
    .split("_")
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "id") {
        return "ID";
      }
      return part.length > 0
        ? part[0].toUpperCase() + part.slice(1).toLowerCase()
        : part;
    })
    .join(" ");

const isSortableHeader = (header: string): header is SortableHeader =>
  (SORTABLE_HEADERS as readonly string[]).includes(header);

const formatDateTime = (rawValue: string | number | boolean | null | undefined) => {
  const value = formatCellValue(rawValue);
  if (value === "-") {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getProviderIconSrc = (providerValue: string | number | boolean | null | undefined) => {
  const normalized = formatCellValue(providerValue).toLowerCase();
  return (Object.keys(PROVIDER_MODELS) as ProviderKey[]).includes(
    normalized as ProviderKey
  )
    ? `/img/${normalized}.webp`
    : null;
};

function RoundedSelect({
  value,
  options,
  placeholder,
  disabled,
  leadingIconSrc,
  leadingIconAlt,
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
    options.find((option) => option.value === value) ?? null;
  const displayLabel = selectedLabel?.label || placeholder;
  const displayClass = !value ? "text-[#9ca3af]" : "text-[#111827]";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) {
            return;
          }
          setIsOpen((prev) => !prev);
        }}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm outline-none transition focus-within:border-[#4f49e2] focus-within:ring-2 focus-within:ring-[#4f49e2]/20 ${
          disabled
            ? "cursor-not-allowed border-[#e0e5f0] bg-white/90"
            : "border-[#e0e5f0] bg-white"
        }`}
      >
        <span className={`flex items-center gap-2 ${displayClass}`}>
          {selectedLabel?.iconSrc || leadingIconSrc ? (
            <Image
              src={selectedLabel?.iconSrc || leadingIconSrc || ""}
              alt={selectedLabel ? `${selectedLabel.label} logo` : leadingIconAlt || "icon"}
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
          ) : null}
          <span>{displayLabel}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-[#9ca3af]" />
      </button>

      {isOpen && !disabled ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
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
            {options.map((option) => (
              <button
                key={option.value}
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
                <span className="flex items-center gap-2">
                  {option.iconSrc ? (
                    <Image
                      src={option.iconSrc}
                      alt={`${option.label} logo`}
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                  ) : null}
                  <span>{option.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LLMManagementPage() {
  const [llms, setLlms] = useState<LLMRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [hiddenHeaders, setHiddenHeaders] = useState<Record<string, boolean>>(
    {}
  );
  const [sortKey, setSortKey] = useState<SortableHeader>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey | "">(
    ""
  );
  const [selectedModelName, setSelectedModelName] = useState("");
  const [description, setDescription] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isDescriptionTouched, setIsDescriptionTouched] = useState(false);
  const [isApiKeyTouched, setIsApiKeyTouched] = useState(false);
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LLMRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const llmsRef = useRef<LLMRecord[]>([]);
  const requestIdRef = useRef(0);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);
  const createModalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    llmsRef.current = llms;
  }, [llms]);

  const resetCreateForm = () => {
    setSelectedProvider("");
    setSelectedModelName("");
    setDescription("");
    setApiKey("");
    setIsDescriptionTouched(false);
    setIsApiKeyTouched(false);
    setIsSubmitAttempted(false);
    setShowApiKey(false);
    setCreateError("");
  };

  const loadLlms = useCallback(
    async (options?: { signal?: AbortSignal; refresh?: boolean }) => {
      const requestId = ++requestIdRef.current;
      const hasData = llmsRef.current.length > 0;
      const shouldRefresh = Boolean(options?.refresh && hasData);

      if (shouldRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setLoadError("");
      }

      try {
        const response = await fetch(LLM_LIST_URL, {
          headers: { accept: "application/json" },
          signal: options?.signal,
        });
        const data = await response.json();

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (response.ok && Array.isArray(data)) {
          const normalized = data
            .map(normalizeLlmRecord)
            .filter((item): item is LLMRecord => item !== null);
          setLlms(normalized);
          setLoadError("");
        } else if (!shouldRefresh) {
          setLoadError(getErrorMessage(data, "Unable to load LLMs."));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (!shouldRefresh) {
          setLoadError("Unable to load LLMs.");
        }
      } finally {
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (shouldRefresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    loadLlms({ signal: controller.signal });
    return () => controller.abort();
  }, [loadLlms]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadLlms({ refresh: true });
      }
    };
    const handleFocus = () => loadLlms({ refresh: true });

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadLlms]);

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
    if (!isCreateOpen) {
      return;
    }

    const modalElement = createModalRef.current;
    if (!modalElement) {
      return;
    }

    const selector =
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    const getFocusable = () =>
      Array.from(modalElement.querySelectorAll<HTMLElement>(selector)).filter(
        (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1
      );

    const focusableElements = getFocusable();
    focusableElements[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isCreating) {
          setIsCreateOpen(false);
        }
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === firstElement || !modalElement.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCreateOpen, isCreating]);

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }
    await loadLlms({ refresh: true });
  };

  const providerOptions: SelectOption[] = (
    Object.keys(PROVIDER_MODELS) as ProviderKey[]
  ).map((provider) => ({
    value: provider,
    label: toLabel(provider),
    iconSrc: `/img/${provider}.webp`,
  }));
  const modelOptions: SelectOption[] = selectedProvider
    ? PROVIDER_MODELS[selectedProvider].map((modelName) => ({
        value: modelName,
        label: modelName,
        iconSrc: `/img/${selectedProvider}.webp`,
      }))
    : [];
  const selectedProviderIconSrc = selectedProvider
    ? `/img/${selectedProvider}.webp`
    : null;
  const normalizedDescription = description.trim();
  const normalizedApiKey = apiKey.trim();
  const isDescriptionValid = normalizedDescription.length >= DESCRIPTION_MIN_LENGTH;
  const isApiKeyValid = normalizedApiKey.length > 0;
  const shouldShowDescriptionError =
    (isDescriptionTouched || isSubmitAttempted) && !isDescriptionValid;
  const shouldShowApiKeyError =
    (isApiKeyTouched || isSubmitAttempted) && !isApiKeyValid;
  const isCreateDisabled =
    !selectedProvider ||
    !selectedModelName ||
    !isDescriptionValid ||
    !isApiKeyValid ||
    isCreating;

  const handleCreateLlm = async () => {
    if (isCreateDisabled) {
      setIsSubmitAttempted(true);
      setIsDescriptionTouched(true);
      setIsApiKeyTouched(true);
      return;
    }

    setIsCreating(true);
    setCreateError("");
    setIsSubmitAttempted(true);

    const payload = {
      model_id: buildModelId(selectedProvider, selectedModelName),
      provider: selectedProvider,
      name: selectedModelName,
      description: normalizedDescription,
      api_key: normalizedApiKey,
    };

    try {
      const response = await fetch(LLM_CREATE_URL, {
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

      if (!response.ok) {
        setCreateError(getErrorMessage(data, "Unable to create LLM."));
        return;
      }

      setIsCreateOpen(false);
      resetCreateForm();
      setToastMessage("LLM created successfully.");
      setIsToastVisible(true);
      await loadLlms({ refresh: true });
    } catch {
      setCreateError("Unable to create LLM.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    const modelId = String(deleteTarget.model_id ?? "").trim();
    if (!modelId || modelId === "-") {
      setDeleteError("Model ID is missing. Unable to delete this LLM.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `${LLM_API_BASE}/llms/${encodeURIComponent(modelId)}`,
        {
          method: "DELETE",
          headers: { accept: "application/json" },
        }
      );

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const isDeleteOk =
        response.ok &&
        Boolean(
          data &&
            typeof data === "object" &&
            "ok" in data &&
            (data as { ok?: unknown }).ok === true
        );

      if (!isDeleteOk) {
        setDeleteError(getErrorMessage(data, "Unable to delete LLM."));
        return;
      }

      setDeleteTarget(null);
      setToastMessage("LLM deleted successfully.");
      setIsToastVisible(true);
      await loadLlms({ refresh: true });
    } catch {
      setDeleteError("Unable to delete LLM.");
    } finally {
      setIsDeleting(false);
    }
  };

  const tableHeaders = useMemo(() => {
    const headerSet = new Set<string>();
    llms.forEach((item) => {
      Object.keys(item).forEach((key) => headerSet.add(key));
    });

    const preferredOrder = [
      "model_id",
      "provider",
      "name",
      "created_at",
      "description",
    ];
    const ordered = preferredOrder.filter((key) => headerSet.has(key));
    const extras = Array.from(headerSet).filter(
      (key) => !preferredOrder.includes(key)
    );
    return [...ordered, ...extras];
  }, [llms]);

  useEffect(() => {
    setHiddenHeaders((previous) => {
      const next: Record<string, boolean> = {};
      tableHeaders.forEach((header) => {
        if (previous[header]) {
          next[header] = true;
        }
      });
      return next;
    });
  }, [tableHeaders]);

  useEffect(() => {
    if (!isColumnMenuOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node)
      ) {
        setIsColumnMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isColumnMenuOpen]);

  const visibleHeaders = useMemo(
    () => tableHeaders.filter((header) => !hiddenHeaders[header]),
    [tableHeaders, hiddenHeaders]
  );

  const handleToggleHeader = (header: string) => {
    const currentlyVisible = visibleHeaders.includes(header);
    if (currentlyVisible && visibleHeaders.length === 1) {
      return;
    }
    setHiddenHeaders((previous) => ({
      ...previous,
      [header]: !previous[header],
    }));
  };

  const handleSort = (header: SortableHeader) => {
    if (sortKey === header) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(header);
    setSortDirection(header === "created_at" ? "desc" : "asc");
  };

  const filteredLlms = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return llms;
    }
    return llms.filter((item) =>
      Object.values(item).some((value) =>
        formatCellValue(value).toLowerCase().includes(normalizedSearch)
      )
    );
  }, [llms, searchValue]);

  const sortedLlms = useMemo(() => {
    const rows = [...filteredLlms];
    rows.sort((left, right) => {
      const leftRaw = left[sortKey];
      const rightRaw = right[sortKey];

      if (sortKey === "created_at") {
        const leftTime = new Date(formatCellValue(leftRaw)).getTime();
        const rightTime = new Date(formatCellValue(rightRaw)).getTime();
        const leftSafe = Number.isNaN(leftTime) ? 0 : leftTime;
        const rightSafe = Number.isNaN(rightTime) ? 0 : rightTime;
        return sortDirection === "asc"
          ? leftSafe - rightSafe
          : rightSafe - leftSafe;
      }

      const leftText = formatCellValue(leftRaw);
      const rightText = formatCellValue(rightRaw);
      const compare = leftText.localeCompare(rightText, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirection === "asc" ? compare : -compare;
    });
    return rows;
  }, [filteredLlms, sortDirection, sortKey]);

  const { totalCount, providerCount, describedCount } = useMemo(() => {
    const total = llms.length;
    const providers = new Set(
      llms
        .map((item) => formatCellValue(item.provider).toLowerCase())
        .filter((provider) => provider !== "-")
    ).size;
    const described = llms.filter((item) => {
      const descriptionValue = item.description;
      return Boolean(
        descriptionValue && String(descriptionValue).trim().length > 0
      );
    }).length;
    return {
      totalCount: total,
      providerCount: providers,
      describedCount: described,
    };
  }, [llms]);

  const statCards = [
    {
      title: "Providers",
      value: providerCount,
      note: "Model sources",
      icon: CheckCircle2,
      tone: "from-[#18c964] to-[#00b56c]",
      noteColor: "text-[#16a34a]",
    },
    {
      title: "With description",
      value: describedCount,
      note: "Documented models",
      icon: Zap,
      tone: "from-[#2f80ff] to-[#1aa7ff]",
      noteColor: "text-[#3b82f6]",
    },
    {
      title: "Total LLMs",
      value: totalCount,
      note: "Available now",
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
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4f49e2] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(79,73,226,0.6)]"
            >
              + Create LLM
            </button>
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
                    <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-[#0f1115]">
                      {isLoading || isRefreshing ? (
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
                isSearchFocused ? "w-72" : "w-52"
              }`}
            >
              <Search className="h-4 w-4" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search Models.."
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-transparent text-sm text-[#4f49e2] placeholder:text-[#4f49e2] focus:outline-none"
              />
            </div>
            <div ref={columnMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsColumnMenuOpen((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e0e5f0] bg-white px-4 py-2 text-sm font-semibold text-[#4f49e2] transition hover:bg-[#eef2ff]"
              >
                Columns
                <ChevronDown className="h-4 w-4" />
              </button>
              {isColumnMenuOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
                  <div className="max-h-64 overflow-auto p-2">
                    {tableHeaders.map((header) => {
                      const isVisible = visibleHeaders.includes(header);
                      const isOnlyVisible = isVisible && visibleHeaders.length === 1;
                      return (
                        <label
                          key={header}
                          className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                            isOnlyVisible
                              ? "cursor-not-allowed text-[#9ca3af]"
                              : "cursor-pointer text-[#111827] hover:bg-[#f3f4f6]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            disabled={isOnlyVisible}
                            onChange={() => handleToggleHeader(header)}
                            className="h-4 w-4 rounded border-[#d1d5db] text-[#4f49e2] focus:ring-[#c7c4f7]"
                          />
                          <span className="truncate font-medium uppercase tracking-[0.06em]">
                            {formatHeaderLabel(header)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#eef1f7]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2] shadow-[0_12px_24px_-20px_rgba(79,73,226,0.8)]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <p className="text-sm text-[#6b7280]">Loading LLMs...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fee2e2] text-[#ef4444] shadow-[0_12px_24px_-20px_rgba(239,68,68,0.55)]">
                <Bot className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-[#111827]">
                Unable to load LLMs
              </p>
              <p className="text-sm text-[#6b7280]">{loadError}</p>
            </div>
          ) : visibleHeaders.length === 0 || sortedLlms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2] shadow-[0_12px_24px_-20px_rgba(79,73,226,0.8)]">
                <Bot className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-[#111827]">
                {llms.length === 0 ? "No LLMs found" : "No matching LLMs found"}
              </p>
            </div>
          ) : (
            <div className="min-w-[1100px]">
              <div
                className="sticky top-0 z-10 grid bg-[#f3f6fb] px-4 py-3 text-xs font-semibold text-[#111827]"
                style={{
                  gridTemplateColumns: `repeat(${visibleHeaders.length}, minmax(0, 1fr)) 96px`,
                }}
              >
                {visibleHeaders.map((header) => {
                  if (!isSortableHeader(header)) {
                    return (
                      <span key={header} className="uppercase tracking-[0.08em]">
                        {formatHeaderLabel(header)}
                      </span>
                    );
                  }

                  const isActiveSort = sortKey === header;
                  return (
                    <button
                      key={header}
                      type="button"
                      onClick={() => handleSort(header)}
                      className="inline-flex items-center gap-1 text-left uppercase tracking-[0.08em] text-[#111827] transition hover:text-[#4f49e2]"
                    >
                      {formatHeaderLabel(header)}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition ${
                          isActiveSort
                            ? `${sortDirection === "asc" ? "rotate-180" : ""} text-[#4f49e2]`
                            : "text-[#a3aed0]"
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-right uppercase tracking-[0.08em]">
                  Action
                </span>
              </div>
              <div className="divide-y divide-[#eef1f7] bg-white">
                {sortedLlms.map((item, index) => {
                  const rowKey = `${formatCellValue(item.model_id)}-${index}`;
                  const modelId = formatCellValue(item.model_id);
                  return (
                    <div
                      key={rowKey}
                      className="grid items-center px-4 py-4 text-sm text-[#2b3341] transition-colors hover:bg-[#f8f9fd]"
                      style={{
                        gridTemplateColumns: `repeat(${visibleHeaders.length}, minmax(0, 1fr)) 96px`,
                      }}
                    >
                      {visibleHeaders.map((header, headerIndex) => {
                        if (header === "model_id") {
                          return (
                            <span
                              key={`${header}-${index}`}
                              className="max-w-[360px] break-all whitespace-normal font-semibold text-[#1c2330]"
                              title={modelId}
                            >
                              {modelId}
                            </span>
                          );
                        }

                        if (header === "provider") {
                          const providerValue = formatCellValue(item[header]);
                          const providerIcon = getProviderIconSrc(item[header]);
                          return (
                            <span key={`${header}-${index}`}>
                              <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#f4f6fb] px-2.5 py-1">
                                {providerIcon ? (
                                  <Image
                                    src={providerIcon}
                                    alt={`${providerValue} logo`}
                                    width={16}
                                    height={16}
                                    className="h-4 w-4 object-contain"
                                  />
                                ) : null}
                                <span className="truncate">{providerValue}</span>
                              </span>
                            </span>
                          );
                        }

                        if (header === "created_at") {
                          const rawValue = formatCellValue(item[header]);
                          const formattedDate = formatDateTime(item[header]);
                          return (
                            <span
                              key={`${header}-${index}`}
                              className={`${headerIndex === 0 ? "font-semibold text-[#1c2330]" : "text-[#2b3341]"} truncate`}
                              title={`${formattedDate}${rawValue !== "-" ? ` (${rawValue})` : ""}`}
                            >
                              {formattedDate}
                            </span>
                          );
                        }

                        if (header === "description") {
                          return (
                            <span
                              key={`${header}-${index}`}
                              className="break-words whitespace-normal text-[#2b3341]"
                              title={formatCellValue(item[header])}
                            >
                              {formatCellValue(item[header])}
                            </span>
                          );
                        }

                        return (
                          <span
                            key={`${header}-${index}`}
                            className={`${headerIndex === 0 ? "font-semibold text-[#1c2330]" : "text-[#2b3341]"} truncate`}
                            title={formatCellValue(item[header])}
                          >
                            {formatCellValue(item[header])}
                          </span>
                        );
                      })}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(item);
                            setDeleteError("");
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffe4e6] text-[#ef4444] transition hover:bg-[#fecdd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444]/40"
                          aria-label={`Delete ${modelId}`}
                          title={`Delete ${modelId}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/30 px-4 py-8">
          <div
            ref={createModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-llm-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.6)]"
          >
            <div className="flex items-center justify-between border-b border-[#eef1f7] px-6 py-4">
              <h4
                id="create-llm-title"
                className="text-lg font-semibold text-[#111827]"
              >
                Create LLM
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (isCreating) {
                    return;
                  }
                  setIsCreateOpen(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              <div className="grid items-start gap-4 md:grid-cols-2">
                <div className="flex h-full flex-col">
                  <label className="min-h-[24px] text-sm font-semibold text-[#111827]">
                    Provider
                  </label>
                  <RoundedSelect
                    value={selectedProvider}
                    options={providerOptions}
                    placeholder="Select provider"
                    onChange={(value) => {
                      const provider = value as ProviderKey | "";
                      setSelectedProvider(provider);
                      setSelectedModelName("");
                    }}
                  />
                  <p className="mt-2 min-h-[36px] text-xs text-[#8b95ad]">
                    Choose source first.
                  </p>
                </div>

                <div className="flex h-full flex-col">
                  <span className="inline-flex min-h-[24px] items-center gap-2 text-sm font-semibold text-[#111827]">
                    Model name
                    {selectedProviderIconSrc ? (
                      <Image
                        src={selectedProviderIconSrc}
                        alt={`${toLabel(selectedProvider)} logo`}
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5 object-contain"
                      />
                    ) : null}
                  </span>
                  <RoundedSelect
                    value={selectedModelName}
                    options={modelOptions}
                    placeholder={
                      selectedProvider ? "Select model" : "Select provider first"
                    }
                    disabled={!selectedProvider}
                    leadingIconSrc={selectedProviderIconSrc ?? undefined}
                    leadingIconAlt={
                      selectedProvider ? `${toLabel(selectedProvider)} logo` : "provider logo"
                    }
                    onChange={setSelectedModelName}
                  />
                  <p className="mt-2 min-h-[36px] text-xs text-[#8b95ad]">
                    {selectedProvider
                      ? "Choose one model from this provider."
                      : "Options appear after provider selection."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#111827]">
                  Description <span className="text-[#ef4444]">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  onBlur={() => setIsDescriptionTouched(true)}
                  placeholder="Describe this LLM usage..."
                  rows={2}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:ring-2 ${
                    shouldShowDescriptionError
                      ? "border-[#fca5a5] focus:border-[#ef4444] focus:ring-[#ef4444]/20"
                      : "border-[#e0e5f0] focus:border-[#4f49e2] focus:ring-[#4f49e2]/20"
                  }`}
                />
                <p
                  className={`text-xs ${
                    shouldShowDescriptionError
                      ? "text-[#dc2626]"
                      : isDescriptionValid
                        ? "text-[#16a34a]"
                        : "text-[#8b95ad]"
                  }`}
                >
                  {shouldShowDescriptionError
                    ? `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters.`
                    : isDescriptionValid
                      ? "Looks good."
                      : `Minimum ${DESCRIPTION_MIN_LENGTH} characters (${Math.min(
                          normalizedDescription.length,
                          DESCRIPTION_MIN_LENGTH
                        )}/${DESCRIPTION_MIN_LENGTH}).`}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#111827]">
                  API key <span className="text-[#ef4444]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    onBlur={() => setIsApiKeyTouched(true)}
                    placeholder="Enter provider API key"
                    autoComplete="new-password"
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-12 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:ring-2 ${
                      shouldShowApiKeyError
                        ? "border-[#fca5a5] focus:border-[#ef4444] focus:ring-[#ef4444]/20"
                        : "border-[#e0e5f0] focus:border-[#4f49e2] focus:ring-[#4f49e2]/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6b7391] transition hover:bg-[#f3f4f6]"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p
                  className={`text-xs ${
                    shouldShowApiKeyError ? "text-[#dc2626]" : "text-[#8b95ad]"
                  }`}
                >
                  {shouldShowApiKeyError
                    ? "API key is required."
                    : "Stored securely and never displayed in plain text."}
                </p>
              </div>

              {createError ? (
                <p className="text-sm font-medium text-[#dc2626]">{createError}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#eef1f7] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  if (isCreating) {
                    return;
                  }
                  setIsCreateOpen(false);
                }}
                className="rounded-xl border border-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateLlm}
                disabled={isCreateDisabled}
                className={`inline-flex min-w-[132px] items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white ${
                  isCreateDisabled
                    ? "cursor-not-allowed bg-[#c7c4f7]"
                    : "bg-[#4f49e2] shadow-[0_10px_24px_-18px_rgba(79,73,226,0.9)] hover:bg-[#3f39d6]"
                }`}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isCreating ? "Creating..." : "Create LLM"}
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
                <h4 className="text-lg font-semibold">Delete LLM</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isDeleting) {
                    return;
                  }
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#b91c1c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#374151]">
                Are you sure you want to delete{" "}
                <span className="rounded-md bg-[#fee2e2] px-2 py-0.5 font-semibold text-[#b91c1c]">
                  {formatCellValue(deleteTarget.model_id)}
                </span>
                ?
              </p>
              <p className="mt-3 text-xs text-[#9b1c1c]">
                This action cannot be undone.
              </p>
              {deleteError ? (
                <p className="mt-3 text-sm text-[#dc2626]">{deleteError}</p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#eef1f7] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  if (isDeleting) {
                    return;
                  }
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="rounded-xl border border-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-18px_rgba(239,68,68,0.8)] ${
                  isDeleting
                    ? "cursor-not-allowed bg-[#fca5a5]"
                    : "bg-[#ef4444] hover:bg-[#dc2626]"
                }`}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isDeleting ? "Deleting..." : "Delete"}
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
    </div>
  );
}
