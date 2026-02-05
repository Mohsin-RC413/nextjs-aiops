const incidents = [
  {
    id: "INC0010095",
    desc: "Mule AI-Agent detected an issue. The application 'warehouse-app05' is currently in 'STOPPED' state.",
    state: "7",
    openedAt: "24/01/2026, 12:44:24",
    active: "false",
    priority: "5",
  },
  {
    id: "INC0010095",
    desc: "Mule AI-Agent detected an issue. The application 'warehouse-app05' is currently in 'STOPPED' state.",
    state: "7",
    openedAt: "24/01/2026, 12:44:24",
    active: "false",
    priority: "5",
  },
  {
    id: "INC0010095",
    desc: "Mule AI-Agent detected an issue. The application 'warehouse-app05' is currently in 'STOPPED' state.",
    state: "7",
    openedAt: "24/01/2026, 12:44:24",
    active: "false",
    priority: "5",
  },
  {
    id: "INC0010095",
    desc: "Mule AI-Agent detected an issue. The application 'warehouse-app05' is currently in 'STOPPED' state.",
    state: "7",
    openedAt: "24/01/2026, 12:44:24",
    active: "false",
    priority: "5",
  },
];

export default function IncidentDetails() {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[#111827]">
              Incident details
            </h3>
            <span className="rounded-md border border-[#cbd2ff] px-2 py-0.5 text-xs font-semibold text-[#5b4cf0]">
              10
            </span>
          </div>
          <p className="mt-2 text-sm text-[#5b6476]">09/12/2025, 12:39:55</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-[#4f49e2] px-4 py-2 text-xs font-semibold text-white"
          >
            24H
          </button>
          <button
            type="button"
            className="rounded-lg border border-[#e0e5f0] px-4 py-2 text-xs font-semibold text-[#111827]"
          >
            7D
          </button>
          <button
            type="button"
            className="rounded-lg border border-[#e0e5f0] px-4 py-2 text-xs font-semibold text-[#111827]"
          >
            30D
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#eef1f7]">
        <div className="grid grid-cols-[1.1fr_3fr_0.8fr_1.2fr_0.8fr_0.8fr_0.9fr] bg-[#f3f6fb] px-4 py-3 text-xs font-semibold text-[#111827]">
          <span>Incident ID</span>
          <span>Description</span>
          <span>State</span>
          <span>Opened At</span>
          <span>Active</span>
          <span>Priority</span>
          <span></span>
        </div>
        <div className="divide-y divide-[#eef1f7] bg-white">
          {incidents.map((row, index) => (
            <div
              key={`${row.id}-${index}`}
              className="grid grid-cols-[1.1fr_3fr_0.8fr_1.2fr_0.8fr_0.8fr_0.9fr] items-center px-4 py-4 text-sm text-[#2b3341]"
            >
              <span className="font-semibold text-[#1c2330]">{row.id}</span>
              <span>{row.desc}</span>
              <span>{row.state}</span>
              <span>{row.openedAt}</span>
              <span>{row.active}</span>
              <span>{row.priority}</span>
              <button
                type="button"
                className="ml-auto rounded-lg bg-[#4f49e2] px-4 py-2 text-xs font-semibold text-white"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
