"use client";

import React, { useState, useMemo } from "react";
import { OJTEntry } from "@/lib/types";
import { formatDate, formatHoursMinutes } from "@/lib/utils";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "react-toastify";

interface TaskTableProps {
  entries: OJTEntry[];
  onDeleteTask: (entryId: string, taskId: string) => void;
  onEditTask: (entry: OJTEntry, taskId: string) => void;
}

interface FlatTask {
  entryId: string;
  taskId: string;
  date: Date;
  taskName: string;
  timeIn: string;
  timeOut: string;
  hoursRendered: number;
  category: string;
  status: string;
  learningOutcome: string;
  isFirstOfDate: boolean;
  supervisor: string;
  createdAt: Date;
}

type SortOption = "created" | "time";

export default function TaskTable({
  entries,
  onDeleteTask,
  onEditTask,
}: TaskTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    entryId: string;
    taskId: string;
    taskName: string;
  }>({
    isOpen: false,
    entryId: "",
    taskId: "",
    taskName: "",
  });

  const sortedTasks = useMemo(() => {
    const allTasks: Omit<FlatTask, "isFirstOfDate">[] = [];

    entries.forEach((entry) => {
      entry.tasks.forEach((task) => {
        allTasks.push({
          entryId: entry.id,
          taskId: task.id,
          date: entry.date,
          taskName: task.taskName,
          timeIn: task.timeIn,
          timeOut: task.timeOut,
          hoursRendered: task.hoursRendered,
          category: task.category,
          status: task.status,
          learningOutcome: entry.notes || "-",
          supervisor: entry.supervisor,
          createdAt: task.createdAt,
        });
      });
    });

    if (sortBy === "created") {
      return allTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else {
      return allTasks.sort((a, b) => {
        const dateCompare =
          new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;

        const timeA = a.timeIn.split(":").map(Number);
        const timeB = b.timeIn.split(":").map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
    }
  }, [entries, sortBy]);

  const { paginatedTasks, totalPages } = useMemo(() => {
    const tasksByDate: { [key: string]: typeof sortedTasks } = {};
    sortedTasks.forEach((task) => {
      const dateKey = new Date(task.date).toDateString();
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    });

    const pages: (typeof sortedTasks)[] = [];
    let currentPageTasks: typeof sortedTasks = [];
    let currentCount = 0;

    Object.entries(tasksByDate).forEach(([_, dateTasks]) => {
      if (currentCount > 0 && currentCount + dateTasks.length > itemsPerPage) {
        pages.push(currentPageTasks);
        currentPageTasks = [...dateTasks];
        currentCount = dateTasks.length;
      } else {
        currentPageTasks.push(...dateTasks);
        currentCount += dateTasks.length;
      }
    });

    if (currentPageTasks.length > 0) {
      pages.push(currentPageTasks);
    }

    const tasksForPage = pages[currentPage - 1] || [];

    const seenDates = new Set<string>();
    const tasksWithDateMarker: FlatTask[] = tasksForPage.map((task) => {
      const dateKey = new Date(task.date).toDateString();
      const isFirstOfDate = !seenDates.has(dateKey);
      if (isFirstOfDate) {
        seenDates.add(dateKey);
      }
      return { ...task, isFirstOfDate };
    });

    return {
      paginatedTasks: tasksWithDateMarker,
      totalPages: pages.length,
    };
  }, [sortedTasks, currentPage, itemsPerPage]);

  const handleDeleteClick = (
    entryId: string,
    taskId: string,
    taskName: string,
  ) => {
    setConfirmModal({ isOpen: true, entryId, taskId, taskName });
  };

  const handleEditClick = (entryId: string, taskId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) onEditTask(entry, taskId);
  };

  const handleConfirmDelete = () => {
    onDeleteTask(confirmModal.entryId, confirmModal.taskId);
    toast.success("Task deleted successfully!");
    setConfirmModal({ isOpen: false, entryId: "", taskId: "", taskName: "" });
  };

  const handleCancelDelete = () => {
    setConfirmModal({ isOpen: false, entryId: "", taskId: "", taskName: "" });
  };

  return (
    <>
      {/* Sort Controls */}
      <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortOption);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 transition-all"
          >
            <option value="created">
              Time Created (When You Added the Task)
            </option>
            <option value="time">
              Time of Day (By Task Time In - Chronological)
            </option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/60 sticky z-10 top-0">
            <tr>
              {[
                "Date",
                "Task",
                "Time",
                "Hours",
                "Category",
                "Learning Outcome",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedTasks.map((task) => (
              <tr
                key={`${task.entryId}-${task.taskId}`}
                className="hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {task.isFirstOfDate ? (
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(new Date(task.date))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-300 dark:text-gray-600">
                      ↳
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {task.taskName}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {task.timeIn} – {task.timeOut}
                  </div>
                </td>

                {/* Hours — violet to match dashboard accent */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                    {formatHoursMinutes(task.hoursRendered)}
                  </div>
                </td>

                {/* Category badge — violet/cyan pill */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">
                    {task.category}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {task.learningOutcome}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditClick(task.entryId, task.taskId)}
                      className="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteClick(
                          task.entryId,
                          task.taskId,
                          task.taskName,
                        )
                      }
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedTasks.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900">
            <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-900/20 w-fit mx-auto mb-3">
              <svg
                className="w-8 h-8 text-violet-400 dark:text-violet-500"
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
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              No tasks recorded yet
            </p>
            <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
              Click &quot;Add Task&quot; to get started
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${confirmModal.taskName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
      />
    </>
  );
}
