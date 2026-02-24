"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import {
  AGENT_API_BASE_URL,
  AGENT_CONNECTORS_BASE_URL,
  AGENT_ORG_KEY,
} from "@/config/agent";

const AGENT_API_BASE = AGENT_API_BASE_URL.endsWith("/")
  ? AGENT_API_BASE_URL.slice(0, -1)
  : AGENT_API_BASE_URL;
const AGENT_VALIDATE_URL = `${AGENT_API_BASE}/aiops/agent/validate`;
const AGENT_TYPES_URL = `${AGENT_API_BASE}/aiops/agent/types`;
const AGENT_SUBTYPES_URL = `${AGENT_API_BASE}/aiops/agent/subtypes`;
const AGENT_ACTIONS_URL = `${AGENT_API_BASE}/aiops/agent/actions`;
const AGENT_CREDENTIALS_URL = `${AGENT_API_BASE}/aiops/agent/connector-credentials`;
const AGENT_CREATE_URL = `${AGENT_API_BASE}/aiops/agent/create`;
const CONNECTORS_LIST_URL = `${AGENT_CONNECTORS_BASE_URL}/aiops/connectors`;

type AgentType = { code: string; name: string };
type AgentAction = { action_code: string; action_name: string };
type CredentialField = {
  field: string;
  type: string;
  label: string;
  value?: string;
};
type SelectOption = { value: string; label: string };

const connectorLogoMap: Record<string, string> = {
  ServiceNow: "/img/ServiceNow.png",
  Mule: "/img/Mule.png",
  Teams:
    "data:image/png;base64,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",
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

type LogoSelectProps = {
  value: string;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  menuInline?: boolean;
  onChange: (value: string) => void;
};

function LogoSelect({
  value,
  options,
  placeholder,
  disabled,
  loading,
  menuInline = false,
  onChange,
}: LogoSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = () => {
    setIsOpen(false);
    requestAnimationFrame(() => setIsOpen(false));
  };

  useEffect(() => {
    if (value) {
      closeMenu();
    }
  }, [value]);

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

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = loading
    ? "Loading..."
    : selectedOption?.label || placeholder;
  const displayClass = loading || !value ? "text-[#9ca3af]" : "text-[#111827]";
  const logo =
    selectedOption?.value && connectorLogoMap[selectedOption.value]
      ? connectorLogoMap[selectedOption.value]
      : null;

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
        <span className="flex items-center gap-2">
          {logo ? (
            <img
              src={logo}
              alt=""
              className="h-5 w-12 object-contain"
            />
          ) : null}
          <span className={displayClass}>{displayLabel}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-[#9ca3af]" />
      </button>

      {isOpen && !disabled && !loading ? (
        <div
          className={`mt-2 w-full overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)] ${
            menuInline ? "" : "absolute z-20"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onChange("");
              closeMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm text-[#6b7280] hover:bg-[#eef2ff]"
          >
            {placeholder}
          </button>
          <div className="max-h-56 overflow-auto">
            {options.map((option) => {
              const optionLogo = connectorLogoMap[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    closeMenu();
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
                    option.value === value
                      ? "bg-[#eef2ff] text-[#4f49e2]"
                      : "text-[#111827] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {optionLogo ? (
                    <img
                      src={optionLogo}
                      alt=""
                      className="h-5 w-12 object-contain"
                    />
                  ) : null}
                  {option.label}
                </button>
              );
            })}
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
  const [connectorsLoading, setConnectorsLoading] = useState(false);
  const [connectorsError, setConnectorsError] = useState("");
  const [connectorOptions, setConnectorOptions] = useState<SelectOption[]>([]);
  const [selectedConnector, setSelectedConnector] = useState("");
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
    if (selectedConnector) {
      window.localStorage.setItem("connector", selectedConnector);
    } else {
      window.localStorage.removeItem("connector");
    }
  }, [selectedConnector, isModalOpen]);

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
    if (!isModalOpen || step !== 3 || typeof window === "undefined") {
      return;
    }
    if (!selectedConnector) {
      const storedConnector = window.localStorage.getItem("connector");
      if (storedConnector) {
        setSelectedConnector(storedConnector);
      }
    }
  }, [isModalOpen, step, selectedConnector]);

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
  }, [isModalOpen, step]);

  useEffect(() => {
    if (!isModalOpen || step !== 3) {
      return;
    }

    const controller = new AbortController();
    const loadConnectors = async () => {
      setConnectorsLoading(true);
      setConnectorsError("");
      try {
        const response = await fetch(CONNECTORS_LIST_URL, {
          method: "GET",
          headers: {
            accept: "application/json",
            "X-Organization-Key": AGENT_ORG_KEY,
          },
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data?.connectors)) {
          const uniqueProviders = Array.from(
            new Set(
              data.connectors.map(
                (item: { provider_code?: string }) => item.provider_code || ""
              )
            )
          ).filter(Boolean);
          setConnectorOptions(
            uniqueProviders.map((provider) => ({
              value: provider,
              label: provider,
            }))
          );
        } else {
          setConnectorOptions([]);
          setConnectorsError("Unable to load connectors.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setConnectorOptions([]);
        setConnectorsError("Unable to load connectors.");
      } finally {
        setConnectorsLoading(false);
      }
    };

    loadConnectors();

    return () => controller.abort();
  }, [isModalOpen, step]);

  useEffect(() => {
    if (!isModalOpen || step !== 3) {
      return;
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

    loadActions();

    return () => controller.abort();
  }, [isModalOpen, step, selectedEnterprise]);

  useEffect(() => {
    if (!isModalOpen || step !== 3) {
      return;
    }
    const controller = new AbortController();
    const storedConnector =
      typeof window !== "undefined"
        ? window.localStorage.getItem("connector")
        : null;
    const connectorValue = selectedConnector || storedConnector || "";
    if (!connectorValue) {
      setCredentialSchema([]);
      setCredentialValues({});
      setCredentialsError("");
      setIsConnectorMissing(false);
      return () => controller.abort();
    }

    const loadCredentials = async () => {
      setCredentialsLoading(true);
      setCredentialsError("");
      setIsConnectorMissing(false);
      setCredentialSchema([]);
      setCredentialValues({});

      try {
        const url = `${AGENT_CREDENTIALS_URL}?subType=${encodeURIComponent(
          connectorValue
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

    loadCredentials();

    return () => controller.abort();
  }, [isModalOpen, step, selectedConnector]);

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
    setConnectorOptions([]);
    setConnectorsError("");
    setSelectedConnector("");
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
      window.localStorage.removeItem("connector");
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
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">
                      <span>Available actions</span>
                      {selectedActions.length === 0 && !actionsLoading ? (
                        <span className="normal-case text-sm font-medium text-[#dc2626]">
                          Select atleast one action.
                        </span>
                      ) : (
                        <span />
                      )}
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
                    <div className="flex justify-center">
                      <div className="w-full max-w-md space-y-2">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-[#64748b]">
                          <span>Connector</span>
                          <LogoSelect
                            value={selectedConnector}
                            options={connectorOptions}
                            placeholder="Select connector"
                            loading={connectorsLoading}
                            disabled={
                              connectorsLoading || connectorOptions.length === 0
                            }
                            menuInline
                            onChange={setSelectedConnector}
                          />
                        </label>
                        {connectorsError ? (
                          <p className="text-sm text-[#dc2626]">
                            {connectorsError}
                          </p>
                        ) : null}
                      </div>
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
