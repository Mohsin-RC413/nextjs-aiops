"use client";

import { useState } from "react";
import CreateConnectorButton from "./CreateConnectorButton";
import DisplayConnectors from "./DisplayConnectors";

export default function ConnectorsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-[#10131a]">Connectors</h2>
        <CreateConnectorButton
          onCreated={() => setRefreshKey((prev) => prev + 1)}
        />
      </div>
      <DisplayConnectors refreshKey={refreshKey} />
    </section>
  );
}
