"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import NotesSection from "@/components/NotesSection";
import { FidgetSpinner } from "react-loader-spinner";
export default function NotesPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
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
            Loading your notes...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-cyan-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Notes
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 ml-3">
            Keep track of important information and reminders
          </p>
        </div>

        {/* Notes Section */}
        <NotesSection />
      </div>
    </DashboardLayout>
  );
}
