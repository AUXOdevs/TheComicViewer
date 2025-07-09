"use client";
import React, { createContext, useContext } from "react";

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  role?: { name?: string };
  subscription?: { expiresAt: string };
  history?: { title: string; date: string }[];
  favorites?: { title: string }[];
};

const ProfileContext = createContext<Profile | null>(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error("useProfile must be used within ProfileProvider");
  return context;
};

export const ProfileProvider = ({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) => (
  <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
);
