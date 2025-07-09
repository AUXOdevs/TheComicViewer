
"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProfileForm } from "../components/profileForm";

export default function ProfileFormPage() {
  const { profile } = useAuth();

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-[#ba681c]">Configuración</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
