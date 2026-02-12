"use client";

import { Plug } from "lucide-react";
import { useState } from "react";
import CreateConnectorButton from "./CreateConnectorButton";
import DisplayConnectors from "./DisplayConnectors";

export default function ConnectorsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#10131a]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f49e2]">
            <Plug className="h-5 w-5" />
          </span>
          Connectors
        </h2>
        <CreateConnectorButton
          onCreated={() => setRefreshKey((prev) => prev + 1)}
        />
      </div>
      <DisplayConnectors refreshKey={refreshKey} />
    </section>
  );
}
