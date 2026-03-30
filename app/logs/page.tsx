"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OJTEntry } from "@/lib/types";
import DashboardLayout from "@/components/DashboardLayout";
import TaskTable from "@/components/TaskTable";
import EntryForm from "@/components/EntryForm";
import { toast } from "react-toastify";

export default function TimeLogsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<OJTEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OJTEntry | undefined>();
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      const response = await fetch("/api/entries");
      if (!response.ok) throw new Error("Failed to fetch entries");
      const loadedEntries = await response.json();
      setEntries(loadedEntries);
    } catch (error) {
      console.error("Failed to load entries:", error);
      toast.error("Failed to load time logs. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
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
        error instanceof Error
          ? error.message
          : "Failed to delete task. Please try again.",
      );
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingEntry(undefined);
    setEditingTaskId(undefined);
    await loadData();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading your time logs...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <DashboardLayout onSettingsUpdate={loadData}>
      <div className="p-6 lg:p-8 mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-cyan-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Time Logs
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 ml-3">
            View and manage all your training time entries
          </p>
        </div>

        {/* Action Button */}
        <div className="mb-6">
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
            Add New Task
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                All Time Entries
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Complete history of your training activities
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
