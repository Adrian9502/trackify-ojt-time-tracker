"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OJTEntry } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import DateDetailsModal from "@/components/DateDetailsModal";
import { formatHoursMinutes } from "@/lib/utils";
import { toast } from "react-toastify";
import { FidgetSpinner } from "react-loader-spinner";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<OJTEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const loadData = async () => {
    try {
      const response = await fetch("/api/entries");
      if (!response.ok) throw new Error("Failed to fetch entries");
      setEntries(await response.json());
    } catch {
      toast.error("Failed to load calendar. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status]);

  // ── Calendar math ───────────────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // ── Entry map ────────────────────────────────────────────────────────────
  const entriesByDate = entries.reduce(
    (acc, entry) => {
      const key = new Date(entry.date).toDateString();
      if (!acc[key]) acc[key] = { totalHours: 0, count: 0, entries: [] };
      acc[key].totalHours += entry.totalHours;
      acc[key].count += 1;
      acc[key].entries.push(entry);
      return acc;
    },
    {} as Record<
      string,
      { totalHours: number; count: number; entries: OJTEntry[] }
    >,
  );

  // ── Month stats ──────────────────────────────────────────────────────────
  const monthStats = days.reduce(
    (acc, day) => {
      const key = new Date(year, month, day).toDateString();
      const d = entriesByDate[key];
      if (d) {
        acc.totalHours += d.totalHours;
        acc.activeDays += 1;
      }
      return acc;
    },
    { totalHours: 0, activeDays: 0 },
  );

  const previousMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    const key = date.toDateString();
    if (entriesByDate[key]?.entries.length) {
      setSelectedDate(date);
      setShowDetailsModal(true);
    }
  };

  const getEntriesForDate = (date: Date): OJTEntry[] =>
    entriesByDate[date.toDateString()]?.entries ?? [];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FidgetSpinner
            visible={true}
            height="80"
            width="80"
            ariaLabel="fidget-spinner-loading"
            wrapperStyle={{}}
            wrapperClass="fidget-spinner-wrapper"
            backgroundColor="#8b5cf6"
          />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const todayKey = new Date().toDateString();

  return (
    <DashboardLayout onSettingsUpdate={loadData}>
      <div className="p-6 lg:p-8">
        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full bg-linear-to-b from-violet-500 to-cyan-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Calendar View
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 ml-3">
            Visual timeline of your training activities · click a date to view
            details
          </p>
        </div>

        {/* ── Month summary pills ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Active Days",
              value: monthStats.activeDays,
              sub: "this month",
              iconBg: "bg-violet-50 dark:bg-violet-900/20",
              iconColor: "text-violet-600 dark:text-violet-400",
              accent: "from-violet-500 to-purple-600",
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
            },
            {
              label: "Hours This Month",
              value: formatHoursMinutes(monthStats.totalHours),
              sub: "logged so far",
              iconBg: "bg-cyan-50 dark:bg-cyan-900/20",
              iconColor: "text-cyan-600 dark:text-cyan-400",
              accent: "from-cyan-500 to-blue-500",
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
            },
            {
              label: "Avg / Active Day",
              value: monthStats.activeDays
                ? formatHoursMinutes(
                    monthStats.totalHours / monthStats.activeDays,
                  )
                : "—",
              sub: "average session",
              iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
              iconColor: "text-emerald-600 dark:text-emerald-400",
              accent: "from-emerald-400 to-teal-500",
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
            },
          ].map((card) => (
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Calendar Card ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Navigation header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={previousMonth}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="text-center">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>

            <button
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Grid */}
          <div className="p-4 sm:p-6">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center py-2">
                  <span className="hidden sm:inline text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {d}
                  </span>
                  <span className="sm:hidden text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {d.charAt(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {blanks.map((b) => (
                <div key={`blank-${b}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const date = new Date(year, month, day);
                const key = date.toDateString();
                const dayData = entriesByDate[key];
                const isToday = key === todayKey;
                const hasEntries = !!dayData?.entries.length;

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    disabled={!hasEntries}
                    className={[
                      "aspect-square rounded-xl border flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-150 relative overflow-hidden group",
                      isToday
                        ? "border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                        : hasEntries
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md cursor-pointer"
                          : "border-gray-100 dark:border-gray-700 cursor-default",
                    ].join(" ")}
                  >
                    {/* Today gradient top bar */}
                    {isToday && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-violet-500 to-cyan-500" />
                    )}

                    <span
                      className={[
                        "text-xs sm:text-sm font-semibold leading-none mb-0.5",
                        isToday
                          ? "text-violet-600 dark:text-violet-400"
                          : hasEntries
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-400 dark:text-gray-600",
                      ].join(" ")}
                    >
                      {day}
                    </span>

                    {hasEntries && (
                      <>
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                          {formatHoursMinutes(dayData.totalHours)}
                        </span>
                        <span className="hidden sm:block text-[8px] text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors mt-0.5 leading-none">
                          {dayData.count}{" "}
                          {dayData.count === 1 ? "entry" : "entries"}
                        </span>
                      </>
                    )}

                    {/* Hover indicator for clickable days */}
                    {hasEntries && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-emerald-400 dark:ring-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-md border-2 border-violet-400 bg-violet-50 dark:border-violet-500 dark:bg-violet-900/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-violet-500 to-cyan-500" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Today
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-md border-2 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Has entries · click to view
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-md border-2 border-gray-100 dark:border-gray-700" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                No entries
              </span>
            </div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedDate && (
        <DateDetailsModal
          isOpen={showDetailsModal}
          date={selectedDate}
          entries={getEntriesForDate(selectedDate)}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
