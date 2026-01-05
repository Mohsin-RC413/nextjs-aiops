'use client';

import { AGENT_SERVICE_HOST } from "@/config/api";
import { AgentSummary } from "@/lib/useAgents";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

type DropdownOption = { label: string; value: string };
const settingsTabs = [
  { key: "ruleset", label: "Ruleset" },
  { key: "knowledge", label: "Knowledge Base" },
  { key: "security", label: "Security" },
] as const;
type SettingsTab = (typeof settingsTabs)[number]["key"];

const getMuleDropdownBase = (port: number) => `${AGENT_SERVICE_HOST}:${port}/agent/mule/dropdown`;

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

  const openModal = () => {
    setIsOpen(true);
    setSettingsTab("ruleset");
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
  };

  const closeModal = () => {
    setIsOpen(false);
    setSettingsTab("ruleset");
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
        localStorage.setItem(
          getSettingsStorageKey("status", agent.agentId, platformValue),
          JSON.stringify(next),
        );
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
        localStorage.setItem(
          getSettingsStorageKey("notifications", agent.agentId, platformValue),
          JSON.stringify(next),
        );
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Agent settings</p>
                <h3 className="text-2xl font-semibold text-slate-900">{agent.name}</h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {settingsTabs.map((tab) => {
                const isActive = settingsTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSettingsTab(tab.key)}
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
                      isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-inner">
              {settingsTab === "ruleset" ? (
                <div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-slate-600">
                      Application
                      <select
                        className={`mt-2 w-full rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
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
                    <label className="text-sm font-medium text-slate-600">
                      Platform
                      <select
                        className={`mt-2 w-full rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
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
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4">
                        <p className="text-sm font-medium text-slate-600">Status</p>
                        {statusLoading ? (
                          <p className="mt-2 text-xs text-slate-400">Loading status options...</p>
                        ) : statusOptions.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {statusOptions.map((option) => (
                              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                                  checked={statusSelection.includes(option.value)}
                                  onChange={() => handleStatusToggle(option.value)}
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">No status options available.</p>
                        )}
                      </div>
                      <label className="text-sm font-medium text-slate-600">
                        Ticketing Running Agent
                        <select
                          className={`mt-2 w-full rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
                            ticketLoading ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-white text-slate-900"
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
                      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4">
                        <p className="text-sm font-medium text-slate-600">Notification Agent</p>
                        {notificationLoading ? (
                          <p className="mt-2 text-xs text-slate-400">Loading notification options...</p>
                        ) : notificationOptions.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {notificationOptions.map((option) => (
                              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                                  checked={notificationSelection.includes(option.value)}
                                  onChange={() => handleNotificationToggle(option.value)}
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">No notification options available.</p>
                        )}
                      </div>
                      <label className="text-sm font-medium text-slate-600">
                        Frequency
                        <select
                          className={`mt-2 w-full rounded-2xl border border-slate-200/80 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none ${
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
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Tab data not exist.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
