"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AGENT_API_BASE_URL, AGENT_ORG_KEY } from "@/config/agent";

type AgentTypeOption = {
  code: string;
  name: string;
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
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
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

export default function CreateConnectorButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [agentTypes, setAgentTypes] = useState<SelectOption[]>([]);
  const [enterpriseOptions, setEnterpriseOptions] = useState<SelectOption[]>([]);
  const [selectedAgentType, setSelectedAgentType] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState("");
  const [isAgentTypesLoading, setIsAgentTypesLoading] = useState(false);
  const [isEnterpriseLoading, setIsEnterpriseLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const apiBase = AGENT_API_BASE_URL.endsWith("/")
    ? AGENT_API_BASE_URL.slice(0, -1)
    : AGENT_API_BASE_URL;

  const agentTypesUrl = useMemo(
    () => `${apiBase}/aiops/agent/types?orgKey=${encodeURIComponent(AGENT_ORG_KEY)}`,
    [apiBase]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let isMounted = true;
    const controller = new AbortController();
    const loadTypes = async () => {
      setIsAgentTypesLoading(true);
      setLoadError("");
      try {
        const response = await fetch(agentTypesUrl, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!isMounted) {
          return;
        }
        if (response.ok && Array.isArray(data?.agentTypes)) {
          const mapped = (data.agentTypes as AgentTypeOption[]).map((item) => ({
            value: item.code,
            label: item.name,
          }));
          setAgentTypes(mapped);
        } else {
          setAgentTypes([]);
          setLoadError("Unable to load agent types.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setAgentTypes([]);
          setLoadError("Unable to load agent types.");
        }
      } finally {
        if (isMounted) {
          setIsAgentTypesLoading(false);
        }
      }
    };

    loadTypes();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [agentTypesUrl, isOpen]);

  useEffect(() => {
    if (!selectedAgentType) {
      setEnterpriseOptions([]);
      setSelectedEnterprise("");
      localStorage.removeItem("connector-enterprise");
      return;
    }

    localStorage.setItem("connector-agent-type", selectedAgentType);
    let isMounted = true;
    const controller = new AbortController();
    const loadEnterprises = async () => {
      setIsEnterpriseLoading(true);
      setLoadError("");
      try {
        const url = `${apiBase}/aiops/agent/subtypes?agentType=${encodeURIComponent(
          selectedAgentType
        )}&orgKey=${encodeURIComponent(AGENT_ORG_KEY)}`;
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!isMounted) {
          return;
        }
        if (response.ok && Array.isArray(data?.agents)) {
          const mapped = (data.agents as string[]).map((item) => ({
            value: item,
            label: item,
          }));
          setEnterpriseOptions(mapped);
        } else {
          setEnterpriseOptions([]);
          setLoadError("Unable to load enterprises.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setEnterpriseOptions([]);
          setLoadError("Unable to load enterprises.");
        }
      } finally {
        if (isMounted) {
          setIsEnterpriseLoading(false);
        }
      }
    };

    loadEnterprises();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiBase, selectedAgentType]);

  useEffect(() => {
    if (selectedEnterprise) {
      localStorage.setItem("connector-enterprise", selectedEnterprise);
    } else {
      localStorage.removeItem("connector-enterprise");
    }
  }, [selectedEnterprise]);

  const canProceed = Boolean(selectedAgentType && selectedEnterprise);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#4f49e2] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(79,73,226,0.65)]"
      >
        <Plus className="h-4 w-4" />
        Create Connectors
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 py-8">
          <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.65)]">
            <div className="flex items-center justify-between bg-[#4f49e2] px-6 py-4 text-white">
              <h3 className="text-lg font-semibold">Create Connectors</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-8 py-6">
              <div className="rounded-2xl border border-[#eef1f7] bg-white p-6 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.15)]">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="text-sm font-semibold text-[#111827]">
                    <span>Agent type</span>
                    <div className="mt-2">
                      <RoundedSelect
                        value={selectedAgentType}
                        options={agentTypes}
                        placeholder="Select agent type"
                        loading={isAgentTypesLoading}
                        onChange={(value) => {
                          setSelectedAgentType(value);
                          setSelectedEnterprise("");
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[#111827]">
                    <span>Enterprise</span>
                    <div className="mt-2">
                      <RoundedSelect
                        value={selectedEnterprise}
                        options={enterpriseOptions}
                        placeholder="Select enterprise"
                        disabled={!selectedAgentType}
                        loading={isEnterpriseLoading}
                        onChange={(value) => setSelectedEnterprise(value)}
                      />
                    </div>
                  </div>
                </div>
                {loadError ? (
                  <p className="mt-4 text-sm text-[#dc2626]">{loadError}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#eef1f7] px-8 py-4">
              <button
                type="button"
                className="rounded-xl border border-[#e5e7eb] px-6 py-2 text-sm font-semibold text-[#4f49e2]"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={!canProceed}
                className={`rounded-xl px-6 py-2 text-sm font-semibold text-white ${
                  canProceed
                    ? "bg-[#4f49e2] shadow-[0_10px_24px_-18px_rgba(79,73,226,0.9)]"
                    : "cursor-not-allowed bg-[#c7c4f7]"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
