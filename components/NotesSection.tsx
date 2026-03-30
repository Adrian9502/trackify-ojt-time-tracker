"use client";

import { useState, useEffect } from "react";
import { Note } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import NoteModal from "./NoteModal";
import ConfirmationModal from "./ConfirmationModal";
import { FidgetSpinner } from "react-loader-spinner";

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    noteId: string;
    noteTitle: string;
  }>({ isOpen: false, noteId: "", noteTitle: "" });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await fetch("/api/notes?type=regular");
      if (!response.ok) throw new Error("Failed to fetch notes");
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Failed to load notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = () => {
    setEditingNote(undefined);
    setShowModal(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleDeleteClick = (noteId: string, noteTitle: string) => {
    setDeleteModal({ isOpen: true, noteId, noteTitle });
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/notes/${deleteModal.noteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete note");
      toast.success("Note deleted successfully!");
      await loadNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeleteModal({ isOpen: false, noteId: "", noteTitle: "" });
    }
  };

  const handleModalSuccess = async () => {
    setShowModal(false);
    setEditingNote(undefined);
    await loadNotes();
  };

  const getDayOfWeek = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);

  return (
    <>
      {/* Action Button */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAddNote}
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
          Add Note
        </button>
      </div>

      {/* Notes Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Container Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              All Notes
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Your saved notes and reminders
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12">
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
                Loading notes...
              </p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-7 h-7 text-violet-400 dark:text-violet-500"
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
                No notes yet
              </p>
              <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                Click &quot;Add Note&quot; to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-hidden group hover:shadow-md transition-shadow duration-200"
                >
                  {/* Accent top bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-500" />

                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-1">
                        <span>{formatDate(new Date(note.createdAt))}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-medium">
                          {getDayOfWeek(new Date(note.createdAt))}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {note.title}
                      </h3>
                    </div>

                    {/* Actions — visible on hover */}
                    <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-1.5 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                        title="Edit note"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(note.id, note.title)}
                        className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete note"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-6 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NoteModal
          note={editingNote}
          type="regular"
          onSuccess={handleModalSuccess}
          onCancel={() => {
            setShowModal(false);
            setEditingNote(undefined);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteModal.noteTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, noteId: "", noteTitle: "" })
        }
        type="danger"
      />
    </>
  );
}
