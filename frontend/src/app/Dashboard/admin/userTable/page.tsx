"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import UsersTable from "../components/usersTable";

export default function UsersTablePage() {
  const { profile } = useAuth();

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-[#ba681c]">Usuarios</h1>
      <UsersTable />
    </div>
  );
}
