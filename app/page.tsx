"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OJTEntry, OJTStats } from "@/lib/types";
import { calculateStats } from "@/lib/store";
import { formatHours, formatHoursToDaysHoursMinutes } from "@/lib/utils";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";
import EntryForm from "@/components/EntryForm";
import TaskTable from "@/components/TaskTable";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "react-toastify";
import { FidgetSpinner } from "react-loader-spinner";
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<OJTStats>({
    totalHours: 0,
    completedHours: 0,
    remainingHours: 0,
    progressPercentage: 0,
    entriesCount: 0,
  });
  const [entries, setEntries] = useState<OJTEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OJTEntry | undefined>();
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();
  const [showExportMenu, setShowExportMenu] = useState(false);

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
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status]);

  const handleAddEntry = () => {
    setEditingEntry(undefined);
    setEditingTaskId(undefined);
    setShowForm(true);
  };

  const handleEditTask = (entry: OJTEntry, taskId: string) => {
    setEditingEntry(entry);
    setEditingTaskId(taskId);
    setShowForm(true);
  };

  const handleDeleteTask = async (entryId: string, taskId: string) => {
    try {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return;
      if (entry.tasks.length === 1) {
        const response = await fetch(`/api/entries/${entryId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete entry");
        }
      } else {
        const updatedTasks = entry.tasks.filter((t) => t.id !== taskId);
        const response = await fetch(`/api/entries/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: entry.date,
            supervisor: entry.supervisor,
            notes: entry.notes,
            tasks: updatedTasks.map((t) => ({
              timeIn: t.timeIn,
              timeOut: t.timeOut,
              hoursRendered: t.hoursRendered,
              taskName: t.taskName,
              category: t.category,
              status: t.status,
            })),
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update entry");
        }
      }
      await loadData();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task.",
      );
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingEntry(undefined);
    setEditingTaskId(undefined);
    await loadData();
  };

  const handleExportExcel = () => {
    if (entries.length === 0) {
      toast.warning("No data to export");
      return;
    }
    try {
      exportToExcel(entries, "OJT_Time_Logs");
      toast.success("Excel file exported successfully!");
      setShowExportMenu(false);
    } catch {
      toast.error("Failed to export Excel file");
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      toast.warning("No data to export");
      return;
    }
    try {
      exportToCSV(entries, "OJT_Time_Logs");
      toast.success("CSV file exported successfully!");
      setShowExportMenu(false);
    } catch {
      toast.error("Failed to export CSV file");
    }
  };

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
            backgroundColor="#8b5cf6"
            wrapperClass="fidget-spinner-wrapper"
          />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const statCards = [
    {
      label: "Completed Hours",
      value: formatHours(stats.completedHours),
      tooltip: formatHoursToDaysHoursMinutes(stats.completedHours),
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
      iconBg: "bg-violet-50 dark:bg-violet-900/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      accent: "from-violet-500 to-purple-600",
    },
    {
      label: "Required Hours",
      value: stats.totalHours,
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      iconBg: "bg-cyan-50 dark:bg-cyan-900/20",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      accent: "from-cyan-500 to-blue-500",
    },
    {
      label: "Remaining",
      value: formatHours(stats.remainingHours),
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
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-500 dark:text-orange-400",
      accent: "from-orange-400 to-rose-500",
    },
    {
      label: "Progress",
      value: `${stats.progressPercentage.toFixed(1)}%`,
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
      <div className="p-6 lg:p-8 mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-cyan-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 ml-3">
            Welcome back,{" "}
            <span className="text-violet-600 dark:text-violet-400 font-semibold">
              {session?.user?.name?.split(" ")[0]}
            </span>
            ! Here&apos;s your OJT progress overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-hidden group hover:shadow-md transition-shadow duration-200"
            >
              {/* Subtle gradient top bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.accent}`}
              />

              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-2.5 rounded-xl ${card.iconBg} ${card.iconColor}`}
                >
                  {card.icon}
                </div>
                {card.tooltip && (
                  <div className="group/tip relative">
                    <svg
                      className="w-4 h-4 text-gray-300 dark:text-gray-600 cursor-help"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 whitespace-nowrap z-10">
                      {card.tooltip}
                      <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                {card.label}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
              {formatHours(stats.completedHours)} / {stats.totalHours} hrs
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-violet-500 to-cyan-500 h-2.5 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${Math.min(stats.progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">0%</span>
            <span className="text-xs text-gray-400">100%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleAddEntry}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-violet-500/20"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Task
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 overflow-hidden">
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-2"
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
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export to Excel
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-2"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export to CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Recent Activities
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Your latest time log entries
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <TaskTable
            entries={entries}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
          />
        </div>
      </div>

      {showForm && (
        <EntryForm
          entry={editingEntry}
          taskId={editingTaskId}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingEntry(undefined);
            setEditingTaskId(undefined);
          }}
        />
      )}
    </DashboardLayout>
  );
}
