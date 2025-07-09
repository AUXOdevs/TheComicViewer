
"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { FavoritesList } from "../components/favoriteList";

export default function FavoritesListPage() {
  const { profile } = useAuth();

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-[#ba681c]">Favoritos</h1>
      <FavoritesList profile={profile} />
    </div>
  );
}
