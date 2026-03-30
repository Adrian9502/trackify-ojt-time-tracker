"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OJTEntry, OJTStats } from "@/lib/types";
import { calculateStats } from "@/lib/store";
import { formatHours, formatHoursMinutes } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "react-toastify";

// ─── Mini sparkline component ─────────────────────────────────────────────────
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="url(#spark)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="spark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Donut chart component ─────────────────────────────────────────────────────
function DonutChart({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) return null;
  const r = 54;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * r;

  const paths = slices.reduce(
    (acc, slice) => {
      const prev = acc.at(-1);
      const runningTotal = (prev?.runningTotal ?? 0) + slice.value;
      const offset = ((runningTotal - slice.value) / total) * circumference;
      const length = (slice.value / total) * circumference;
      return [...acc, { ...slice, offset, length, runningTotal }];
    },
    [] as {
      label: string;
      value: number;
      color: string;
      offset: number;
      length: number;
      runningTotal: number;
    }[],
  );

  return (
    <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
      {paths.map((p, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={p.color}
          strokeWidth="20"
          strokeDasharray={`${p.length} ${circumference - p.length}`}
          strokeDashoffset={-p.offset}
          strokeLinecap="butt"
          className="transition-all duration-700"
        />
      ))}
      {/* Inner cutout */}
      <circle
        cx={cx}
        cy={cy}
        r="38"
        fill="white"
        className="dark:fill-gray-800"
      />
    </svg>
  );
}

// ─── Category colors ───────────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<OJTEntry[]>([]);
  const [stats, setStats] = useState<OJTStats>({
    totalHours: 0,
    completedHours: 0,
    remainingHours: 0,
    progressPercentage: 0,
    entriesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const loadData = async () => {
    try {
      const [entriesRes, settingsRes] = await Promise.all([
        fetch("/api/entries"),
        fetch("/api/settings"),
      ]);
      if (!entriesRes.ok || !settingsRes.ok)
        throw new Error("Failed to fetch data");
      const loadedEntries = await entriesRes.json();
      const settings = await settingsRes.json();
      setEntries(loadedEntries);
      setStats(calculateStats(loadedEntries, settings.requiredHours));
    } catch {
      toast.error("Failed to load reports. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const categoryBreakdown = entries.reduce(
    (acc, entry) => {
      entry.tasks.forEach((task) => {
        acc[task.category] = (acc[task.category] || 0) + task.hoursRendered;
      });
      return acc;
    },
    {} as Record<string, number>,
  );

  const monthlyBreakdown = entries.reduce(
    (acc, entry) => {
      const month = new Date(entry.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      acc[month] = (acc[month] || 0) + entry.totalHours;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedMonths = Object.entries(monthlyBreakdown).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
  );
  const monthlyValues = sortedMonths.map(([, v]) => v);
  const maxMonthlyHours = Math.max(...monthlyValues, 1);

  const sortedCategories = Object.entries(categoryBreakdown).sort(
    ([, a], [, b]) => b - a,
  );

  const donutSlices = sortedCategories.map(([label, value], i) => ({
    label,
    value,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const avgHoursPerDay =
    stats.entriesCount > 0 ? stats.completedHours / stats.entriesCount : 0;
  const estimatedDaysLeft =
    avgHoursPerDay > 0 ? Math.ceil(stats.remainingHours / avgHoursPerDay) : 0;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  // ── Stat card data ────────────────────────────────────────────────────────
  const summaryCards = [
    {
      label: "Total Entries",
      value: stats.entriesCount,
      sub: "days logged",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      iconBg: "bg-violet-50 dark:bg-violet-900/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      accent: "from-violet-500 to-purple-600",
    },
    {
      label: "Avg Hours / Day",
      value: formatHours(avgHoursPerDay),
      sub: "hrs per session",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      iconBg: "bg-cyan-50 dark:bg-cyan-900/20",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      accent: "from-cyan-500 to-blue-500",
    },
    {
      label: "Est. Days Left",
      value: estimatedDaysLeft,
      sub: "at current pace",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-500 dark:text-orange-400",
      accent: "from-orange-400 to-rose-500",
    },
    {
      label: "Completion",
      value: `${stats.progressPercentage.toFixed(1)}%`,
      sub: "of required hours",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      accent: "from-emerald-400 to-teal-500",
    },
  ];

  return (
    <DashboardLayout onSettingsUpdate={loadData}>
      <div className="p-6 lg:p-8">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full bg-linear-to-b from-violet-500 to-cyan-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 ml-3">
            Detailed insights into your OJT progress
          </p>
        </div>

        {/* ── Summary Stat Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r ${card.accent}`}
              />
              <div
                className={`inline-flex p-2.5 rounded-xl mb-3 ${card.iconBg} ${card.iconColor}`}
              >
                {card.icon}
              </div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                {card.label}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Monthly Bar Chart ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Monthly Hours
              </h2>
            </div>
            {monthlyValues.length >= 2 && <Sparkline values={monthlyValues} />}
          </div>

          {sortedMonths.length === 0 ? (
            <EmptyState icon="calendar" label="No monthly data available" />
          ) : (
            <div className="space-y-3">
              {sortedMonths.map(([month, hours]) => {
                const pct = (hours / maxMonthlyHours) * 100;
                return (
                  <div key={month} className="group">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {month}
                      </span>
                      <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                        {formatHours(hours)} hrs
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-violet-500 to-cyan-500 transition-all duration-700 shadow-sm"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Two-column: Donut + Category list ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category breakdown with donut */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-5 h-5 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Hours by Category
              </h2>
            </div>

            {sortedCategories.length === 0 ? (
              <EmptyState icon="chart" label="No category data available" />
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Donut */}
                <div className="relative shrink-0">
                  <DonutChart slices={donutSlices} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                      {formatHours(stats.completedHours)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      hrs total
                    </p>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 w-full space-y-2.5 min-w-0">
                  {sortedCategories.map(([category, hours], i) => {
                    const pct = (hours / stats.completedHours) * 100;
                    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                              {category}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white ml-2 whitespace-nowrap">
                            {formatHoursMinutes(hours)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Monthly table — right column */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-5 h-5 text-cyan-600 dark:text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Monthly Breakdown
              </h2>
            </div>

            {sortedMonths.length === 0 ? (
              <EmptyState icon="calendar" label="No monthly data available" />
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left pb-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Month
                      </th>
                      <th className="text-right pb-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Hours
                      </th>
                      <th className="text-right pb-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {[...sortedMonths].reverse().map(([month, hours]) => {
                      const share = stats.completedHours
                        ? ((hours / stats.completedHours) * 100).toFixed(1)
                        : "0.0";
                      return (
                        <tr
                          key={month}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {month}
                          </td>
                          <td className="py-3 px-2 text-sm font-bold text-violet-600 dark:text-violet-400 text-right">
                            {formatHours(hours)} hrs
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400">
                              {share}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-100 dark:border-gray-700">
                      <td className="pt-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Total
                      </td>
                      <td className="pt-3 px-2 text-sm font-bold text-gray-900 dark:text-white text-right">
                        {formatHours(stats.completedHours)} hrs
                      </td>
                      <td className="pt-3 px-2 text-right">
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400">
                          100%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Empty state helper ─────────────────────────────────────────────────────────
function EmptyState({
  icon,
  label,
}: {
  icon: "calendar" | "chart";
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-gray-600">
      {icon === "calendar" ? (
        <svg
          className="w-12 h-12 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ) : (
        <svg
          className="w-12 h-12 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      )}
      <p className="text-sm">{label}</p>
    </div>
  );
}
