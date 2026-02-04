import { Bot, CheckCircle2, Zap } from "lucide-react";

const statCards = [
  {
    title: "Online",
    value: "30",
    note: "All healthy",
    icon: CheckCircle2,
    tone: "from-[#18c964] to-[#00b56c]",
    noteColor: "text-[#16a34a]",
  },
  {
    title: "Offline",
    value: "58",
    note: "Review connectivity",
    icon: Zap,
    tone: "from-[#2f80ff] to-[#1aa7ff]",
    noteColor: "text-[#3b82f6]",
  },
  {
    title: "Total Agents",
    value: "20",
    note: "+2 new this week",
    icon: Bot,
    tone: "from-[#b45cff] to-[#ff5ac8]",
    noteColor: "text-[#e11d8d]",
  },
];

export default function AgentStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="min-w-[220px] rounded-2xl bg-white p-5 shadow-[0_12px_30px_-28px_rgba(16,24,40,0.45)] ring-1 ring-[#eef1f7]"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-[0_10px_20px_-12px_rgba(0,0,0,0.45)]`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-semibold ${card.noteColor}`}>
                {card.note}
              </span>
            </div>
            <p className="mt-5 text-sm font-semibold text-[#5a6476]">
              {card.title}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#0f1115]">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
