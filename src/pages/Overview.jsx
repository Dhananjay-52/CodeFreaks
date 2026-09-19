import {
  FolderKanban,
  FileText,
  Bot,
  Play,
  ArrowUpRight,
  Activity,
} from "lucide-react";

function Overview() {
  const stats = [
    {
      label: "Projects",
      value: "04",
      change: "+2 this month",
      icon: FolderKanban,
    },
    {
      label: "Documents",
      value: "128",
      change: "+24 this week",
      icon: FileText,
    },
    {
      label: "Active Agents",
      value: "06",
      change: "2 currently running",
      icon: Bot,
    },
    {
      label: "Total Runs",
      value: "342",
      change: "+18% this month",
      icon: Play,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-600">
            Workspace Overview
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Good morning, User.
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Here's what's happening across your workspace.
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200">
          New Project
          <ArrowUpRight size={15} />
        </button>

      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#202934] bg-[#0E141A] p-5 transition hover:border-[#303B48]"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#151C24]">
                  <Icon size={18} className="text-gray-300" />
                </div>

                <ArrowUpRight
                  size={15}
                  className="text-gray-700"
                />

              </div>

              <div className="mt-5">

                <p className="text-xs text-gray-600">
                  {stat.label}
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>

                <p className="mt-2 text-[11px] text-gray-600">
                  {stat.change}
                </p>

              </div>

            </div>
          );
        })}

      </div>

      {/* Main grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">

        {/* Recent Activity */}
        <div className="rounded-2xl border border-[#202934] bg-[#0E141A] xl:col-span-2">

          <div className="flex items-center justify-between border-b border-[#202934] px-5 py-4">

            <div>
              <h2 className="text-sm font-semibold">
                Recent Activity
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                Latest workspace operations
              </p>
            </div>

            <button className="text-xs text-gray-500 transition hover:text-white">
              View all
            </button>

          </div>

          <div className="divide-y divide-[#202934]">

            {[
              {
                title: "Document processed",
                description: "inspection_report_042.pdf",
                time: "12 min ago",
              },
              {
                title: "Agent completed a run",
                description: "Approval Note Generator",
                time: "28 min ago",
              },
              {
                title: "Knowledge source updated",
                description: "Refinery Safety Procedures",
                time: "1 hour ago",
              },
              {
                title: "New project created",
                description: "Refinery Inspection",
                time: "3 hours ago",
              },
            ].map((activity, index) => (

              <div
                key={index}
                className="flex items-center gap-4 px-5 py-4"
              >

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#151C24]">
                  <Activity size={15} className="text-gray-400" />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-sm font-medium text-gray-200">
                    {activity.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-gray-600">
                    {activity.description}
                  </p>

                </div>

                <span className="shrink-0 text-[11px] text-gray-600">
                  {activity.time}
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* Workspace Status */}
        <div className="rounded-2xl border border-[#202934] bg-[#0E141A]">

          <div className="border-b border-[#202934] px-5 py-4">

            <h2 className="text-sm font-semibold">
              Workspace Status
            </h2>

            <p className="mt-1 text-xs text-gray-600">
              System health
            </p>

          </div>

          <div className="space-y-5 p-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-sm text-gray-300">
                  AI Runtime
                </span>

              </div>

              <span className="text-xs text-emerald-400">
                Operational
              </span>

            </div>

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-sm text-gray-300">
                  Knowledge Base
                </span>

              </div>

              <span className="text-xs text-emerald-400">
                Healthy
              </span>

            </div>

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-sm text-gray-300">
                  Database
                </span>

              </div>

              <span className="text-xs text-emerald-400">
                Connected
              </span>

            </div>

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-sm text-gray-300">
                  Security
                </span>

              </div>

              <span className="text-xs text-emerald-400">
                Protected
              </span>

            </div>

          </div>

          <div className="border-t border-[#202934] px-5 py-4">

            <div className="flex items-center justify-between">

              <span className="text-xs text-gray-600">
                Environment
              </span>

              <span className="rounded-md border border-[#26313D] bg-[#111820] px-2 py-1 text-[10px] text-gray-400">
                ON-PREMISE
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Overview;