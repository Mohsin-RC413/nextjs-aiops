"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AGENT_API_BASE_URL, AGENT_ORG_KEY } from "@/config/agent";

const AGENT_API_BASE = AGENT_API_BASE_URL.endsWith("/")
  ? AGENT_API_BASE_URL.slice(0, -1)
  : AGENT_API_BASE_URL;
const AGENT_VALIDATE_URL = `${AGENT_API_BASE}/aiops/agent/validate`;
const AGENT_TYPES_URL = `${AGENT_API_BASE}/aiops/agent/types`;
const AGENT_SUBTYPES_URL = `${AGENT_API_BASE}/aiops/agent/subtypes`;

export default function CreateNewAgent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [agentName, setAgentName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [agentTypes, setAgentTypes] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const [agentTypesLoading, setAgentTypesLoading] = useState(false);
  const [agentTypesError, setAgentTypesError] = useState("");
  const [selectedAgentType, setSelectedAgentType] = useState("");
  const [enterpriseOptions, setEnterpriseOptions] = useState<string[]>([]);
  const [enterpriseLoading, setEnterpriseLoading] = useState(false);
  const [enterpriseError, setEnterpriseError] = useState("");
  const [selectedEnterprise, setSelectedEnterprise] = useState("");

  const trimmedAgentName = agentName.trim();
  const isNextDisabled = trimmedAgentName.length === 0 || isValidating;
  const isStepTwoNextDisabled =
    selectedAgentType.length === 0 || selectedEnterprise.length === 0;

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
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsValidating(false);
    setValidationError("");
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
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.6)]">
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

            {step === 1 ? (
              <div className="px-8 py-7">
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

                <div className="mt-6 flex items-center justify-end gap-3">
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
                </div>
              </div>
            ) : (
              <div className="px-8 py-7">
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
                      <select
                        value={selectedAgentType}
                        onChange={(event) => {
                          setSelectedAgentType(event.target.value);
                          setSelectedEnterprise("");
                          setEnterpriseOptions([]);
                          setEnterpriseError("");
                        }}
                        className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4f49e2] focus:ring-2 focus:ring-[#4f49e2]/20"
                      >
                        <option value="" disabled>
                          {agentTypesLoading
                            ? "Loading agent types..."
                            : "Select agent type"}
                        </option>
                        {agentTypes.map((agentType) => (
                          <option key={agentType.code} value={agentType.code}>
                            {agentType.name}
                          </option>
                        ))}
                      </select>
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
                      <select
                        value={selectedEnterprise}
                        onChange={(event) =>
                          setSelectedEnterprise(event.target.value)
                        }
                        disabled={!selectedAgentType || enterpriseLoading}
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                          !selectedAgentType || enterpriseLoading
                            ? "cursor-not-allowed border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af]"
                            : "border-[#e5e7eb] bg-white text-[#111827] focus:border-[#4f49e2] focus:ring-[#4f49e2]/20"
                        }`}
                      >
                        <option value="" disabled>
                          {enterpriseLoading
                            ? "Loading enterprises..."
                            : "Select enterprise"}
                        </option>
                        {enterpriseOptions.map((enterprise) => (
                          <option key={enterprise} value={enterprise}>
                            {enterprise}
                          </option>
                        ))}
                      </select>
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

                <div className="mt-6 flex items-center justify-end gap-3">
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
                    className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white ${
                      isStepTwoNextDisabled
                        ? "cursor-not-allowed bg-[#a7a6f2]"
                        : "bg-[#4f49e2] shadow-[0_10px_24px_-18px_rgba(79,73,226,0.9)] hover:bg-[#433ccf]"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
