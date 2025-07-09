
"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionCard } from "../components/suscriptionsCard";

export default function SuscriptionsCardPage() {
  const { profile } = useAuth();

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-[#ba681c]">Suscripciones</h1>
      <SubscriptionCard profile={profile} />
    </div>
  );
}
