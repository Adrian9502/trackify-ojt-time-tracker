"use client";

import { OJTEntry } from "@/lib/types";
import { formatHoursMinutes } from "@/lib/utils";

interface DateDetailsModalProps {
  isOpen: boolean;
  date: Date;
  entries: OJTEntry[];
  onClose: () => void;
}

export default function DateDetailsModal({
  isOpen,
  date,
  entries,
  onClose,
}: DateDetailsModalProps) {
  if (!isOpen) return null;

  const tasksForDate = entries.flatMap((entry) =>
    entry.tasks.map((task) => ({
      ...task,
      learningOutcome: entry.notes || "-",
      entryDate: entry.date,
    })),
  );

  const sortedTasks = tasksForDate.sort((a, b) => {
    const timeA = a.timeIn.split(":").map(Number);
    const timeB = b.timeIn.split(":").map(Number);
    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
  });

  const totalHours = sortedTasks.reduce(
    (sum, task) => sum + task.hoursRendered,
    0,
  );

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col">
        {/* Gradient bar */}
        <div className="h-0.5 bg-gradient-to-r from-violet-500 to-cyan-500 shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {dateStr}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"}
              {" · "}
              {formatHoursMinutes(totalHours)} hours total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0 mt-0.5"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tasks list */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No tasks for this date
              </p>
            </div>
          ) : (
            sortedTasks.map((task, index) => (
              <div
                key={task.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
              >
                {/* Task header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex-1 truncate">
                    {task.taskName}
                  </p>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 shrink-0">
                    {task.category}
                  </span>
                </div>

                {/* Time grid */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                      Time In
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {task.timeIn}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                      Time Out
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {task.timeOut}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                      Duration
                    </p>
                    <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                      {formatHoursMinutes(task.hoursRendered)}
                    </p>
                  </div>
                </div>

                {/* Learning outcome */}
                {task.learningOutcome !== "-" && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                      Learning Outcome
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                      {task.learningOutcome}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Total hours
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {formatHoursMinutes(totalHours)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:shadow-violet-500/20 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
