
"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { HistoryList } from "../components/historyList";

export default function HistoryListPage() {
  const { profile } = useAuth();

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-[#ba681c]">Historial</h1>
      <HistoryList profile={profile} />
    </div>
  );
}
