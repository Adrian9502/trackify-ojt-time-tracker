"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { OJTEntry } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { calculateHours, formatHoursMinutes } from "@/lib/utils";
import { toast } from "react-toastify";

interface EntryFormProps {
  entry?: OJTEntry;
  taskId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  date: string;
  timeIn: string;
  timeOut: string;
  taskName: string;
  category: string;
  notes?: string;
}

export default function EntryForm({
  entry,
  taskId,
  onSuccess,
  onCancel,
}: EntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [hoursRendered, setHoursRendered] = useState(0);

  const isEditMode = !!entry && !!taskId;
  const editingTask = isEditMode
    ? entry?.tasks.find((t) => t.id === taskId)
    : null;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues:
      isEditMode && editingTask
        ? {
            date: new Date(entry.date).toISOString().split("T")[0],
            timeIn: editingTask.timeIn,
            timeOut: editingTask.timeOut,
            taskName: editingTask.taskName,
            category: editingTask.category,
            notes: entry.notes || "",
          }
        : {
            date: new Date().toISOString().split("T")[0],
            timeIn: "",
            timeOut: "",
            taskName: "",
            category: "",
            notes: "",
          },
  });

  const timeIn = watch("timeIn");
  const timeOut = watch("timeOut");

  useEffect(() => {
    if (timeIn && timeOut) {
      const hours = calculateHours(timeIn, timeOut);
      setHoursRendered(hours);
    }
  }, [timeIn, timeOut]);

  const onSubmit = async (data: FormData) => {
    if (hoursRendered <= 0) {
      toast.error("Please enter valid time in and time out");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && entry) {
        const updatedTasks = entry.tasks.map((task) =>
          task.id === taskId
            ? {
                timeIn: data.timeIn,
                timeOut: data.timeOut,
                hoursRendered,
                taskName: data.taskName,
                category: data.category,
                status: "Completed",
              }
            : {
                timeIn: task.timeIn,
                timeOut: task.timeOut,
                hoursRendered: task.hoursRendered,
                taskName: task.taskName,
                category: task.category,
                status: task.status,
              },
        );

        const response = await fetch(`/api/entries/${entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: data.date,
            supervisor: entry.supervisor,
            notes: data.notes,
            tasks: updatedTasks,
          }),
        });

        if (!response.ok) throw new Error("Failed to update task");
        toast.success("Task updated successfully!");
      } else {
        const response = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: data.date,
            supervisor: "N/A",
            notes: data.notes,
            tasks: [
              {
                timeIn: data.timeIn,
                timeOut: data.timeOut,
                hoursRendered,
                taskName: data.taskName,
                category: data.category,
                status: "Completed",
              },
            ],
          }),
        });

        if (!response.ok) throw new Error("Failed to save task");
        toast.success("Task added successfully!");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full text-sm px-3 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-2xl w-full my-8 overflow-hidden">
        {/* Gradient top accent bar — matches dashboard stat cards */}
        <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 to-cyan-500" />

        <div className="p-6">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-cyan-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Edit Task" : "Add New Task"}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-3">
              {isEditMode
                ? "Update your task details"
                : "Record your training activity"}
            </p>
          </div>

          <div className="space-y-5">
            {/* Row 1: Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Date <span className="text-violet-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("date", { required: "Date is required" })}
                  className={inputClass}
                />
                {errors.date && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>

              {/* Time In */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Time In <span className="text-violet-500">*</span>
                </label>
                <input
                  type="time"
                  {...register("timeIn", { required: "Time in is required" })}
                  className={inputClass}
                />
                {errors.timeIn && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.timeIn.message}
                  </p>
                )}
              </div>

              {/* Time Out */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Time Out <span className="text-violet-500">*</span>
                </label>
                <input
                  type="time"
                  {...register("timeOut", { required: "Time out is required" })}
                  className={inputClass}
                />
                {errors.timeOut && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.timeOut.message}
                  </p>
                )}
              </div>
            </div>

            {/* Hours Display — matches dashboard progress card style */}
            {hoursRendered > 0 && (
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-500" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        Hours Rendered
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                        {formatHoursMinutes(hoursRendered)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                    Calculated
                  </span>
                </div>
              </div>
            )}

            {/* Row 2: Task and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Task Description <span className="text-violet-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("taskName", {
                    required: "Task description is required",
                  })}
                  className={inputClass}
                  placeholder="What did you work on?"
                />
                {errors.taskName && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.taskName.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Category <span className="text-violet-500">*</span>
                </label>
                <select
                  {...register("category", {
                    required: "Category is required",
                  })}
                  className={inputClass}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>

            {/* Learning Outcome */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Learning Outcome{" "}
                <span className="text-gray-400 dark:text-gray-600 normal-case font-normal">
                  (Optional)
                </span>
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                className={inputClass + " resize-none"}
                placeholder="What did you learn? Any insights or observations..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:shadow-violet-500/20"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : isEditMode ? (
                  "Update Task"
                ) : (
                  <>
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
                    Save Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
