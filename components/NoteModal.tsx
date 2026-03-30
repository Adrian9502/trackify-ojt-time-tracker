"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Note } from "@/lib/types";
import { toast } from "react-toastify";

interface NoteModalProps {
  note?: Note;
  type: "regular" | "ooo";
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  content: string;
  oooDate?: string;
  oooTimeStart?: string;
  oooTimeEnd?: string;
  isOneDay?: boolean;
}

export default function NoteModal({
  note,
  type,
  onSuccess,
  onCancel,
}: NoteModalProps) {
  const [loading, setLoading] = useState(false);
  const [isOneDay, setIsOneDay] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: note
      ? {
          title: note.title,
          content: note.content,
          oooDate: note.oooDate
            ? new Date(note.oooDate).toISOString().split("T")[0]
            : undefined,
          oooTimeStart: note.oooTimeStart || undefined,
          oooTimeEnd: note.oooTimeEnd || undefined,
          isOneDay: note.isOneDay || false,
        }
      : {
          title: "",
          content: "",
          oooDate: undefined,
          oooTimeStart: undefined,
          oooTimeEnd: undefined,
          isOneDay: false,
        },
  });

  const watchIsOneDay = watch("isOneDay");

  useEffect(() => {
    if (watchIsOneDay) {
      setIsOneDay(true);
      setValue("oooTimeStart", "08:00");
      setValue("oooTimeEnd", "17:00");
    } else {
      setIsOneDay(false);
    }
  }, [watchIsOneDay, setValue]);

  const onSubmit = async (data: FormData) => {
    if (type === "ooo" && !data.oooDate) {
      toast.error("Please select a date for the out-of-office");
      return;
    }
    setLoading(true);
    try {
      const url = note ? `/api/notes/${note.id}` : "/api/notes";
      const method = note ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          type,
          isOneDay: data.isOneDay || false,
        }),
      });
      if (!response.ok) throw new Error("Failed to save note");
      toast.success(
        note ? "Note updated successfully!" : "Note added successfully!",
      );
      onSuccess();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="relative p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-violet-500 to-cyan-500" />
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-cyan-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {note ? "Edit" : "Add"}{" "}
                {type === "regular" ? "Note" : "Out of Office"}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {type === "regular"
                  ? "Record important notes or reminders"
                  : "Track your out-of-office time and details"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {type === "regular" ? "Title" : "Title of Out of Office"}{" "}
              <span className="text-violet-500">*</span>
            </label>
            <input
              type="text"
              {...register("title", { required: "Title is required" })}
              className={inputClass}
              placeholder={
                type === "regular"
                  ? "e.g., Important Meeting Notes"
                  : "e.g., Annual Leave, Sick Leave, Personal Day"
              }
            />
            {errors.title && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* OOO-specific fields */}
          {type === "ooo" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Date <span className="text-violet-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("oooDate", {
                    required: type === "ooo" ? "Date is required" : false,
                  })}
                  className={inputClass}
                />
                {errors.oooDate && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">
                    {errors.oooDate.message}
                  </p>
                )}

                {/* One Day Checkbox */}
                <label className="mt-3 flex items-center gap-2.5 cursor-pointer w-fit">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="isOneDay"
                      {...register("isOneDay")}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all" />
                    <svg
                      className="absolute inset-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none p-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    1 Day OOO (Full work day)
                  </span>
                </label>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    Start Time <span className="text-violet-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register("oooTimeStart", {
                      required:
                        type === "ooo" ? "Start time is required" : false,
                    })}
                    disabled={isOneDay}
                    className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.oooTimeStart && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">
                      {errors.oooTimeStart.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    End Time <span className="text-violet-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register("oooTimeEnd", {
                      required: type === "ooo" ? "End time is required" : false,
                    })}
                    disabled={isOneDay}
                    className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.oooTimeEnd && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">
                      {errors.oooTimeEnd.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {type === "regular" ? "Content" : "Reason"}{" "}
              <span className="text-violet-500">*</span>
            </label>
            <textarea
              {...register("content", { required: "This field is required" })}
              rows={5}
              className={`${inputClass} resize-none`}
              placeholder={
                type === "regular"
                  ? "Write your notes here..."
                  : "e.g., Family vacation, Medical appointment, Personal matters..."
              }
            />
            {errors.content && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-violet-500/20 disabled:cursor-not-allowed"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading
                ? "Saving..."
                : note
                  ? `Update ${type === "regular" ? "Note" : "OOO"}`
                  : `Save ${type === "regular" ? "Note" : "OOO"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
