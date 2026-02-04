'use client';

import { AGENT_SERVICE_HOST } from "@/config/api";
import type { AgentSummary } from "@/lib/useAgents";
import { Bot, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AgentActivityLogProps = {
  agents: AgentSummary[];
  className?: string;
  title?: string;
};

type LogEntry = {
  id: string;
  message: string;
  displayedMessage: string;
  time: string;
  level: string;
};

const MAX_LOGS = 200;
const MESSAGE_DELAY_MS = 250;
const TYPE_SPEED_MS = 12;
const TYPE_CHUNK_SIZE = 3;

const getSocketBase = () => AGENT_SERVICE_HOST.replace(/^http/, "ws");

const stripHtml = (value: string) => {
  const withBreaks = value.replace(/<br\s*\/?>/gi, "\n");
  if (typeof window !== "undefined" && "DOMParser" in window) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(withBreaks, "text/html");
    return (doc.body.textContent ?? withBreaks).trim();
  }
  return withBreaks.replace(/<[^>]*>/g, "").trim();
};

const normalizeMessage = (value: string) => stripHtml(value).replace(/\s+\n/g, "\n").trim();

const formatLogPayload = (raw: string): { message: string; time: string; level: string } => {
  try {
    const parsed = JSON.parse(raw) as { message?: unknown; time?: unknown; level?: unknown };
    const messageRaw =
      typeof parsed.message === "string"
        ? parsed.message
        : parsed.message !== undefined
        ? JSON.stringify(parsed.message)
        : raw;
    const message = normalizeMessage(messageRaw || raw) || normalizeMessage(raw);
    const time = typeof parsed.time === "string" ? parsed.time : new Date().toLocaleTimeString();
    const level = typeof parsed.level === "string" ? parsed.level.toUpperCase() : "INFO";
    return { message, time, level };
  } catch {
    const time = new Date().toLocaleTimeString();
    return { message: normalizeMessage(raw), time, level: "INFO" };
  }
};

export function AgentActivityLog({ agents, className, title = "Agent activity" }: AgentActivityLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const queueRef = useRef<LogEntry[]>([]);
  const typingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isTypingIndicator, setIsTypingIndicator] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  const muleAgent = useMemo(
    () =>
      agents.find(
        (agent) =>
          agent.running &&
          !!agent.port &&
          (agent.enterprise ?? agent.type ?? "").toLowerCase().includes("mule"),
      ) ?? null,
    [agents],
  );

  const flushQueue = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (queueRef.current.length === 0) {
      typingRef.current = false;
      setIsTypingIndicator(false);
      return;
    }
    typingRef.current = true;
    setIsTypingIndicator(true);
    const next = queueRef.current.shift();
    if (!next) {
      typingRef.current = false;
      setIsTypingIndicator(false);
      return;
    }
    const entry: LogEntry = { ...next, displayedMessage: "" };
    setLogs((prev) => {
      const updated = [entry, ...prev];
      return updated.length > MAX_LOGS ? updated.slice(0, MAX_LOGS) : updated;
    });

    let index = 0;
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
    }
    typingIntervalRef.current = window.setInterval(() => {
      index = Math.min(entry.message.length, index + TYPE_CHUNK_SIZE);
      const slice = entry.message.slice(0, index);
      setLogs((prev) =>
        prev.map((log) => (log.id === entry.id ? { ...log, displayedMessage: slice } : log)),
      );
      if (index >= entry.message.length) {
        if (typingIntervalRef.current) {
          window.clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        timeoutRef.current = window.setTimeout(() => {
          typingRef.current = false;
          setIsTypingIndicator(false);
          flushQueue();
        }, MESSAGE_DELAY_MS);
      }
    }, TYPE_SPEED_MS);
  };

  useEffect(() => {
    queueRef.current = [];
    setLogs([]);
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (!muleAgent || !muleAgent.port) {
      return undefined;
    }

    const socketUrl = `${getSocketBase()}:${muleAgent.port}/ws/agent?agent_id=${muleAgent.agentId}`;
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const payload = typeof event.data === "string" ? event.data : String(event.data);
      const { message, time, level } = formatLogPayload(payload);
      queueRef.current.push({
        id: `${Date.now()}-${Math.random()}`,
        message,
        displayedMessage: "",
        time,
        level,
      });
      if (!typingRef.current) {
        flushQueue();
      }
    };

    socket.onerror = () => {
      // Suppress connection errors in the UI.
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      typingRef.current = false;
      queueRef.current = [];
      setIsTypingIndicator(false);
    };
  }, [muleAgent, refreshIndex]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!isFullscreen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullscreen]);

  const logContainerClass = isFullscreen ? "mt-4 flex-1 overflow-y-auto pr-2" : "mt-4 max-h-[360px] overflow-y-auto pr-2";

  const handleRefresh = () => {
    queueRef.current = [];
    setLogs([]);
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    typingRef.current = false;
    setIsTypingIndicator(false);
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setRefreshIndex((prev) => prev + 1);
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200/70 bg-[#f2f2f2] p-5 text-slate-900 shadow-[0_14px_35px_rgba(15,23,42,0.18)] font-medium tracking-[0.08em] ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      } ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-700">{title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {muleAgent
              ? `Streaming from ${muleAgent.name} (running at ${muleAgent.port})`
              : "No MuleSoft agent started. Please start MuleSoft agent to show logs."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            onClick={handleRefresh}
            aria-label="Refresh logs"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <span
            className={`h-2.5 w-2.5 rounded-full ${muleAgent ? "bg-emerald-400" : "bg-slate-500"}`}
            aria-label={muleAgent ? "Agent online" : "Agent offline"}
          />
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className={logContainerClass}>
        {muleAgent && logs.length === 0 ? (
          <p className="text-sm text-slate-600">Waiting for agent activity...</p>
        ) : null}
        {!muleAgent ? null : (
          <div className="flex flex-col gap-3">
            {isTypingIndicator ? (
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
              </div>
            ) : null}
            {logs.map((log) => {
              const level = log.level.toUpperCase();
              const bubbleTone =
                level === "ERROR"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : level === "WARN" || level === "WARNING"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-slate-200 bg-slate-100 text-slate-900";
              const badgeTone =
                level === "ERROR"
                  ? "bg-rose-100 text-rose-700"
                  : level === "WARN" || level === "WARNING"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-200 text-slate-600";
              return (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-600/60 bg-slate-800">
                    <Bot className="h-4 w-4 text-slate-300" aria-hidden="true" />
                  </span>
                  <div className={`max-w-[92%] rounded-xl border px-3 py-2 text-sm shadow-sm ${bubbleTone}`}>
                    <p className="whitespace-pre-line leading-relaxed">
                      {log.displayedMessage}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      <span className={`rounded-full px-2 py-0.5 ${badgeTone}`}>{level}</span>
                      <span className="normal-case text-slate-500">{log.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
