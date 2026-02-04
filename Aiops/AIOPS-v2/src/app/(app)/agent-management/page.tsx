import AgentRegistry from "./AgentRegistry";
import AgentStats from "./AgentStats";
import CreateNewAgent from "./createnewagent";

export default function AgentManagementPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white px-8 py-7 shadow-[0_18px_50px_-38px_rgba(16,24,40,0.5)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                Agent management
              </h2>
              <p className="mt-2 text-sm text-[#5b6476]">
                Lifecycle, versioning, and health of deployed agents.
              </p>
            </div>
            <CreateNewAgent />
          </div>

          <AgentStats />
        </div>
      </section>

      <AgentRegistry />
    </div>
  );
}
