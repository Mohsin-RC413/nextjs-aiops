"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { AGENT_API_BASE_URL, AGENT_ORG_KEY } from "@/config/agent";

const AGENT_API_BASE = AGENT_API_BASE_URL.endsWith("/")
  ? AGENT_API_BASE_URL.slice(0, -1)
  : AGENT_API_BASE_URL;
const AGENT_VALIDATE_URL = `${AGENT_API_BASE}/aiops/agent/validate`;
const AGENT_TYPES_URL = `${AGENT_API_BASE}/aiops/agent/types`;
const AGENT_SUBTYPES_URL = `${AGENT_API_BASE}/aiops/agent/subtypes`;
const AGENT_ACTIONS_URL = `${AGENT_API_BASE}/aiops/agent/actions`;
const AGENT_CREDENTIALS_URL = `${AGENT_API_BASE}/aiops/agent/connector-credentials`;
const AGENT_CREATE_URL = `${AGENT_API_BASE}/aiops/agent/create`;

type AgentType = { code: string; name: string };
type AgentAction = { action_code: string; action_name: string };
type CredentialField = {
  field: string;
  type: string;
  label: string;
  value?: string;
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
  const displayLabel = loading
    ? "Loading..."
    : selectedLabel || placeholder;
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
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm outline-none transition focus-within:border-[#4f49e2] focus-within:ring-2 focus-within:ring-[#4f49e2]/20 ${
          disabled || loading
            ? "cursor-not-allowed border-[#e5e7eb] bg-[#f3f4f6]"
            : "border-[#e5e7eb] bg-white"
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
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type CreateNewAgentProps = {
  onCreateSuccess?: () => void | Promise<void>;
};

export default function CreateNewAgent({ onCreateSuccess }: CreateNewAgentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agentName, setAgentName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [agentTypes, setAgentTypes] = useState<AgentType[]>([]);
  const [agentTypesLoading, setAgentTypesLoading] = useState(false);
  const [agentTypesError, setAgentTypesError] = useState("");
  const [selectedAgentType, setSelectedAgentType] = useState("");
  const [enterpriseOptions, setEnterpriseOptions] = useState<string[]>([]);
  const [enterpriseLoading, setEnterpriseLoading] = useState(false);
  const [enterpriseError, setEnterpriseError] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState("");
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsError, setActionsError] = useState("");
  const [availableActions, setAvailableActions] = useState<AgentAction[]>([]);
  const [selectedActions, setSelectedActions] = useState<AgentAction[]>([]);
  const [availableSelection, setAvailableSelection] = useState<string[]>([]);
  const [selectedSelection, setSelectedSelection] = useState<string[]>([]);
  const [credentialSchema, setCredentialSchema] = useState<CredentialField[]>(
    []
  );
  const [credentialValues, setCredentialValues] = useState<
    Record<string, string>
  >({});
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState("");
  const [isConnectorMissing, setIsConnectorMissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const stepContentRef = useRef<HTMLDivElement | null>(null);

  const trimmedAgentName = agentName.trim();
  const isNextDisabled = trimmedAgentName.length === 0 || isValidating;
  const isStepTwoNextDisabled =
    selectedAgentType.length === 0 || selectedEnterprise.length === 0;
  const isStepThreeSubmitDisabled =
    isSubmitting || isConnectorMissing || selectedActions.length === 0;

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
    if (!isModalOpen || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("agentname", agentName);
  }, [agentName, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || typeof window === "undefined") {
      return;
    }
    if (selectedAgentType) {
      window.localStorage.setItem("agenttype", selectedAgentType);
    } else {
      window.localStorage.removeItem("agenttype");
    }
  }, [selectedAgentType, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || typeof window === "undefined") {
      return;
    }
    if (selectedEnterprise) {
      window.localStorage.setItem("enterprise", selectedEnterprise);
    } else {
      window.localStorage.removeItem("enterprise");
    }
  }, [selectedEnterprise, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || typeof window === "undefined") {
      return;
    }
    if (selectedActions.length > 0) {
      const codes = selectedActions.map((action) => action.action_code);
      window.localStorage.setItem("actioncodes", JSON.stringify(codes));
    } else {
      window.localStorage.removeItem("actioncodes");
    }
  }, [selectedActions, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || step !== 2) {
      return;
    }

    const controller = new AbortController();

    const loadAgentTypes = async () => {
      setAgentTypesLoading(true);
      setAgentTypesError("");

      try {
        const url = `${AGENT_TYPES_URL}?orgKey=${encodeURIComponent(
          AGENT_ORG_KEY
        )}`;
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        console.log("Agent types response:", {
          ok: response.ok,
          status: response.status,
          data,
        });

        if (response.ok && Array.isArray(data?.agentTypes)) {
          setAgentTypes(data.agentTypes);
        } else {
          setAgentTypesError(data?.message || "Unable to load agent types.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setAgentTypesError("Unable to load agent types.");
      } finally {
        setAgentTypesLoading(false);
      }
    };

    loadAgentTypes();

    return () => controller.abort();
  }, [isModalOpen, step]);

  useEffect(() => {
    if (!isModalOpen || step !== 2 || !selectedAgentType) {
      return;
    }

    const controller = new AbortController();

    const loadEnterpriseOptions = async () => {
      setEnterpriseLoading(true);
      setEnterpriseError("");
      setEnterpriseOptions([]);

      try {
        const url = `${AGENT_SUBTYPES_URL}?agentType=${encodeURIComponent(
          selectedAgentType
        )}&orgKey=${encodeURIComponent(AGENT_ORG_KEY)}`;
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        console.log("Agent subtypes response:", {
          ok: response.ok,
          status: response.status,
          data,
        });

        if (response.ok && Array.isArray(data?.agents)) {
          setEnterpriseOptions(data.agents);
        } else {
          setEnterpriseError(
            data?.message || "Unable to load enterprise options."
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setEnterpriseError("Unable to load enterprise options.");
      } finally {
        setEnterpriseLoading(false);
      }
    };

    loadEnterpriseOptions();

    return () => controller.abort();
  }, [isModalOpen, step, selectedAgentType]);

  useEffect(() => {
    if (!isModalOpen || step !== 3) {
      return;
    }
    const scrollTarget = stepContentRef.current;
    if (scrollTarget) {
      scrollTarget.scrollTo({ top: 160, behavior: "smooth" });
    }

    const controller = new AbortController();
    const storedEnterprise =
      typeof window !== "undefined"
        ? window.localStorage.getItem("enterprise")
        : null;
    const enterpriseValue = selectedEnterprise || storedEnterprise || "";
    if (!enterpriseValue) {
      return () => controller.abort();
    }

    const loadActions = async () => {
      setActionsLoading(true);
      setActionsError("");
      setAvailableActions([]);
      setSelectedActions([]);
      setAvailableSelection([]);
      setSelectedSelection([]);

      try {
        const url = `${AGENT_ACTIONS_URL}?subType=${encodeURIComponent(
          enterpriseValue
        )}&orgKey=${encodeURIComponent(AGENT_ORG_KEY)}`;
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        console.log("Agent actions response:", {
          ok: response.ok,
          status: response.status,
          data,
        });

        if (response.ok && Array.isArray(data?.actions)) {
          setAvailableActions(data.actions);
        } else {
          setActionsError(data?.message || "Unable to load actions.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setActionsError("Unable to load actions.");
      } finally {
        setActionsLoading(false);
      }
    };

    const loadCredentials = async () => {
      setCredentialsLoading(true);
      setCredentialsError("");
      setIsConnectorMissing(false);
      setCredentialSchema([]);
      setCredentialValues({});

      try {
        const url = `${AGENT_CREDENTIALS_URL}?subType=${encodeURIComponent(
          enterpriseValue
        )}&orgKey=${encodeURIComponent(AGENT_ORG_KEY)}`;
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const data = await response.json();
        console.log("Agent credentials response:", {
          ok: response.ok,
          status: response.status,
          data,
        });

        if (response.ok && Array.isArray(data?.schema)) {
          setCredentialSchema(data.schema);
          const initialValues: Record<string, string> = {};
          data.schema.forEach((field: CredentialField) => {
            initialValues[field.field] = field.value ?? "";
          });
          setCredentialValues(initialValues);
        } else if (
          typeof data?.detail === "string" &&
          data.detail.toLowerCase().includes("connector not found")
        ) {
          setIsConnectorMissing(true);
          setCredentialsError("Connector not found. Create connector first.");
        } else {
          setCredentialsError(
            data?.message || "Unable to load credential schema."
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setCredentialsError("Unable to load credential schema.");
      } finally {
        setCredentialsLoading(false);
      }
    };

    loadActions();
    loadCredentials();

    return () => controller.abort();
  }, [isModalOpen, step, selectedEnterprise]);

  const openCreateAgent = () => {
    setIsModalOpen(true);
    setStep(1);
    setAgentName("");
    setValidationError("");
    setSelectedAgentType("");
    setSelectedEnterprise("");
    setAgentTypes([]);
    setEnterpriseOptions([]);
    setAgentTypesError("");
    setEnterpriseError("");
    setAvailableActions([]);
    setSelectedActions([]);
    setActionsError("");
    setCredentialSchema([]);
    setCredentialValues({});
    setCredentialsError("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsValidating(false);
    setValidationError("");
    setSubmitError("");
    setSubmitSuccess("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("agentname");
      window.localStorage.removeItem("agenttype");
      window.localStorage.removeItem("enterprise");
      window.localStorage.removeItem("actioncodes");
    }
  };

  const handleValidateAgentName = async () => {
    if (trimmedAgentName.length === 0 || isValidating) {
      return;
    }

    const requestBody = {
      orgKey: AGENT_ORG_KEY,
      agentName: trimmedAgentName,
    };

    console.log("Agent validate request body:", requestBody);

    setIsValidating(true);
    setValidationError("");

    try {
      const response = await fetch(AGENT_VALIDATE_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Agent validate response:", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (response.ok && data?.valid) {
        setStep(2);
        return;
      }

      setValidationError(data?.message || "Agent name validation failed.");
    } catch (error) {
      setValidationError("Unable to validate agent name. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateAgent = async () => {
    if (isSubmitting) {
      return;
    }

    const credentialsPayload = credentialSchema.map((field) => ({
      ...field,
      value: credentialValues[field.field] ?? "",
    }));

    const requestBody = {
      orgKey: AGENT_ORG_KEY,
      agentName: trimmedAgentName,
      agentType: selectedAgentType,
      subType: selectedEnterprise,
      credentials: {
        schema: credentialsPayload,
      },
      actions: {
        actions: selectedActions,
      },
    };

    console.log("Create agent request:", requestBody);

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const response = await fetch(AGENT_CREATE_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Create agent response:", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (!response.ok) {
        setSubmitError(data?.message || "Unable to create agent.");
        return;
      }

      setSubmitSuccess("Agent created successfully.");
      setToastMessage("Agent Created Successfully");
      setIsToastVisible(true);
      closeModal();
      await onCreateSuccess?.();
    } catch (error) {
      setSubmitError("Unable to create agent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openCreateAgent}
        className="inline-flex items-center gap-2 rounded-xl bg-[#4f49e2] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(79,73,226,0.6)]"
      >
        <Plus className="h-4 w-4" />
        Create Agent
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
          <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.6)] max-h-[90vh]">
            <div className="flex items-center justify-between bg-[#4f49e2] px-6 py-4 text-white">
              <h3 className="text-lg font-semibold">Create agent</h3>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div
                ref={stepContentRef}
                className="flex-1 overflow-y-auto px-8 py-7"
              >
                {step === 1 ? (
                  <div>
                <div className="space-y-2">
                  <h4 className="text-xl font-semibold text-[#101828]">
                    Connect your new intelligence
                  </h4>
                  <p className="text-sm text-[#6b7280]">Step 1 of 3</p>
                </div>

                <div className="mt-6 rounded-2xl border border-[#eef1f7] bg-white p-6 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.5)]">
                  <h5 className="text-lg font-semibold text-[#111827]">
                    Name your agent
                  </h5>
                  <p className="mt-2 text-sm text-[#6b7280]">
                    Give your agent a name that reflects its role.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-[#111827]">
                      <span>Agent name</span>
                      <span className="text-xs text-[#6b7280]">
                        {agentName.length}/20
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={20}
                      value={agentName}
                      onChange={(event) =>
                        setAgentName(event.target.value.slice(0, 20))
                      }
                      placeholder="Enter agent name"
                      className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4f49e2] focus:ring-2 focus:ring-[#4f49e2]/20"
                    />
                    {validationError ? (
                      <p className="text-sm text-[#dc2626]">
                        {validationError}
                      </p>
                    ) : null}
                  </div>
                </div>

              </div>
            ) : step === 2 ? (
              <div>
                <div className="space-y-2">
                  <h4 className="text-xl font-semibold text-[#101828]">
                    Connect your new intelligence
                  </h4>
                  <p className="text-sm text-[#6b7280]">Step 2 of 3</p>
                </div>

                <div className="mt-6 rounded-2xl border border-[#eef1f7] bg-white p-6 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.5)]">
                  <h5 className="text-lg font-semibold text-[#111827]">
                    Configure the agent experience
                  </h5>
                  <p className="mt-2 text-sm text-[#6b7280]">
                    Pick the type, enterprise, and LLM to back it.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-[#111827]">
                        Agent type
                      </span>
                      <RoundedSelect
                        value={selectedAgentType}
                        onChange={(value) => {
                          setSelectedAgentType(value);
                          setSelectedEnterprise("");
                          setEnterpriseOptions([]);
                          setEnterpriseError("");
                        }}
                        options={agentTypes.map((agentType) => ({
                          value: agentType.code,
                          label: agentType.name,
                        }))}
                        placeholder="Select agent type"
                        loading={agentTypesLoading}
                      />
                      {agentTypesError ? (
                        <p className="text-sm text-[#dc2626]">
                          {agentTypesError}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-[#111827]">
                        Enterprise
                      </span>
                      <RoundedSelect
                        value={selectedEnterprise}
                        onChange={(value) => setSelectedEnterprise(value)}
                        options={enterpriseOptions.map((enterprise) => ({
                          value: enterprise,
                          label: enterprise,
                        }))}
                        placeholder="Select enterprise"
                        loading={enterpriseLoading}
                        disabled={!selectedAgentType}
                      />
                      {enterpriseError ? (
                        <p className="text-sm text-[#dc2626]">
                          {enterpriseError}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <span className="text-sm font-semibold text-[#111827]">
                      LLM
                    </span>
                    <div className="rounded-xl bg-[#f3f4f6] px-4 py-3 text-sm text-[#9ca3af]">
                      Groq
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-[0.3em] text-[#64748b]">
                    Create Agent
                  </p>
                  <h4 className="text-2xl font-semibold text-[#0f172a]">
                    Connect your new intelligence
                  </h4>
                  <p className="text-sm text-[#6b7280]">Step 3 of 3</p>
                </div>

                <div className="mt-6 rounded-2xl border border-[#e6ecf5] bg-[#f8fafc] p-6 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.5)]">
                  <h5 className="text-lg font-semibold text-[#111827]">
                    Authorize the integrations
                  </h5>
                  <p className="mt-2 text-sm text-[#64748b]">
                    Provide credentials and optional server information.
                  </p>
                  {submitError ? (
                    <p className="mt-3 text-sm text-[#dc2626]">
                      {submitError}
                    </p>
                  ) : null}
                  {submitSuccess ? (
                    <p className="mt-3 text-sm text-[#16a34a]">
                      {submitSuccess}
                    </p>
                  ) : null}

                  <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">
                      Available actions
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr]">
                      <select
                        multiple
                        size={6}
                        value={availableSelection}
                        onChange={(event) => {
                          const values = Array.from(
                            event.target.selectedOptions
                          ).map((option) => option.value);
                          setAvailableSelection(values);
                        }}
                        className="h-44 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#4f49e2] focus:ring-2 focus:ring-[#4f49e2]/20"
                      >
                        {actionsLoading ? (
                          <option disabled>Loading actions...</option>
                        ) : null}
                        {!actionsLoading && availableActions.length === 0 ? (
                          <option disabled>
                            {actionsError
                              ? actionsError
                              : "No actions available."}
                          </option>
                        ) : null}
                        {availableActions.map((action) => (
                          <option
                            key={action.action_code}
                            value={action.action_code}
                          >
                            {action.action_name}
                          </option>
                        ))}
                      </select>

                      <div className="flex flex-col items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (availableSelection.length === 0) {
                              return;
                            }
                            const moving = new Set(availableSelection);
                            const moved = availableActions.filter((action) =>
                              moving.has(action.action_code)
                            );
                            const remaining = availableActions.filter(
                              (action) => !moving.has(action.action_code)
                            );
                            setAvailableActions(remaining);
                            setSelectedActions([
                              ...selectedActions,
                              ...moved,
                            ]);
                            setAvailableSelection([]);
                          }}
                          className="rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#64748b] shadow-sm hover:border-[#c7d2fe]"
                        >
                          &gt;&gt;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedSelection.length === 0) {
                              return;
                            }
                            const moving = new Set(selectedSelection);
                            const moved = selectedActions.filter((action) =>
                              moving.has(action.action_code)
                            );
                            const remaining = selectedActions.filter(
                              (action) => !moving.has(action.action_code)
                            );
                            setSelectedActions(remaining);
                            setAvailableActions([
                              ...availableActions,
                              ...moved,
                            ]);
                            setSelectedSelection([]);
                          }}
                          className="rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#64748b] shadow-sm hover:border-[#c7d2fe]"
                        >
                          &lt;&lt;
                        </button>
                      </div>

                      <select
                        multiple
                        size={6}
                        value={selectedSelection}
                        onChange={(event) => {
                          const values = Array.from(
                            event.target.selectedOptions
                          ).map((option) => option.value);
                          setSelectedSelection(values);
                        }}
                        className="h-44 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#4f49e2] focus:ring-2 focus:ring-[#4f49e2]/20"
                      >
                        {selectedActions.length === 0 ? (
                          <option disabled>Selected values</option>
                        ) : null}
                        {selectedActions.map((action) => (
                          <option
                            key={action.action_code}
                            value={action.action_code}
                          >
                            {action.action_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">
                      <span>Credentials</span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {credentialsLoading ? (
                        <div className="col-span-full text-sm text-[#64748b]">
                          Loading credentials...
                        </div>
                      ) : null}
                      {credentialsError ? (
                        <div className="col-span-full text-center text-sm text-[#dc2626]">
                          {credentialsError}
                        </div>
                      ) : null}
                      {!isConnectorMissing
                        ? credentialSchema.map((field) => (
                            <label
                              key={field.field}
                              className="flex flex-col gap-2 text-sm font-semibold text-[#64748b]"
                            >
                              <span>{field.label}</span>
                              <input
                                type={
                                  field.type === "password" ? "password" : "text"
                                }
                                value={credentialValues[field.field] ?? ""}
                                readOnly
                                placeholder={field.label}
                                className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4f49e2] focus:ring-2 focus:ring-[#4f49e2]/20"
                              />
                            </label>
                          ))
                        : null}
                    </div>
                  </div>
                </div>

              </div>
            )}
              </div>

              <div className="flex items-center justify-between border-t border-[#eef1f7] px-8 py-5">
                {step === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-[#e5e7eb] px-6 py-2.5 text-sm font-semibold text-[#374151]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleValidateAgentName}
                      disabled={isNextDisabled}
                      className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition ${
                        isNextDisabled
                          ? "cursor-not-allowed bg-[#a7a6f2]"
                          : "bg-[#4f49e2] shadow-[0_10px_24px_-18px_rgba(79,73,226,0.9)] hover:bg-[#433ccf]"
                      }`}
                    >
                      {isValidating ? "Validating..." : "Next"}
                    </button>
                  </>
                ) : step === 2 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-xl border border-[#e5e7eb] px-6 py-2.5 text-sm font-semibold text-[#374151]"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={isStepTwoNextDisabled}
                      onClick={() => setStep(3)}
                      className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white ${
                        isStepTwoNextDisabled
                          ? "cursor-not-allowed bg-[#a7a6f2]"
                          : "bg-[#4f49e2] shadow-[0_10px_24px_-18px_rgba(79,73,226,0.9)] hover:bg-[#433ccf]"
                      }`}
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-xl border border-[#e5e7eb] px-6 py-2.5 text-sm font-semibold text-[#374151]"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAgent}
                      disabled={isStepThreeSubmitDisabled}
                      className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white ${
                        isStepThreeSubmitDisabled
                          ? "cursor-not-allowed bg-[#a7a6f2]"
                          : "bg-[#4f49e2] shadow-[0_10px_24px_-18px_rgba(79,73,226,0.9)] hover:bg-[#433ccf]"
                      }`}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isToastVisible ? (
        <div className="fixed bottom-6 right-6 z-50">
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
    </>
  );
}
