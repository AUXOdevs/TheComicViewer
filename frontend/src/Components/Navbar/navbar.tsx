"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/16/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();
  const hasSynced = useRef(false);

  const syncUserWithSupabase = useCallback(async () => {
    if (!user || hasSynced.current) return;
    hasSynced.current = true;

    console.log("Iniciando sincronización con Supabase...");
    console.log("Datos del usuario:", user);

    try {
      const supabase = createClientComponentClient();

      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("auth0_id", user.sub)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error al verificar si el usuario existe:", fetchError);
        return;
      }

      if (!existingUser) {
        const insertData = {
          auth0_id: user.sub,
          name: user.name || "Desconocido",
          email: user.email,
          picture: user.picture,
          last_login: new Date().toISOString(),
          role_id: "fb71ff38-acaa-4b55-97f7-4ce243fb71c1",
        };

        console.log("Insertando usuario en Supabase:", insertData);

        const { error: insertError, data: insertResult } = await supabase
          .from("users")
          .insert([insertData])
          .select();

        if (insertError) {
          console.error(
            "Error al insertar usuario:",
            JSON.stringify(insertError, null, 2)
          );
        } else {
          console.log("Usuario insertado correctamente:", insertResult);
        }
      } else {
        console.log("El usuario ya existe en la base de datos:", existingUser);
      }
    } catch (err) {
      console.error("Error general en syncUserWithSupabase:", err);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      syncUserWithSupabase();
    }
  }, [isAuthenticated, user, syncUserWithSupabase]);

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#20444c] text-[#8db5ac] px-6 py-4 shadow-md z-50">
      <div className="flex items-center justify-between">
        <Link href="/">
          <div className="text-lg font-semibold hover:text-[#ba681c] transition-colors">
            TuComicViewer
          </div>
        </Link>

        <div className="sm:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <XMarkIcon className="h-6 w-6 text-[#8db5ac]" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-[#8db5ac]" />
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <a href="/Comics" className="hover:text-[#ba681c] transition-colors">
            Comic
          </a>
          <a href="/Manga" className="hover:text-[#ba681c] transition-colors">
            Manga
          </a>

          <div className="relative w-full max-w-[200px]">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-3 py-1.5 rounded-md bg-[#2b5b63] text-[#e1f3ef] placeholder-[#a3c9c5] focus:outline-none focus:ring-2 focus:ring-[#8db5ac] transition"
            />
            <svg
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#8db5ac]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>
          </div>

          {!isAuthenticated ? (
            <button onClick={() => login()} title="Iniciar sesión">
              <ArrowLeftEndOnRectangleIcon className="h-6 w-6 hover:text-[#ba681c] transition-colors" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {user?.picture && (
                <Image
                  src={user.picture}
                  alt={user.name || "User"}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              {user?.name && (
                <span className="text-sm text-white hidden sm:inline">
                  {user.name}
                </span>
              )}
              <button onClick={logout} title="Cerrar sesión">
                <ArrowLeftEndOnRectangleIcon className="h-6 w-6 hover:text-red-400 transition-colors" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden mt-4 flex flex-col gap-4">
          <a href="/Comics" className="hover:text-[#ba681c] transition-colors">
            Comic
          </a>
          <a href="/Manga" className="hover:text-[#ba681c] transition-colors">
            Manga
          </a>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-3 py-1.5 rounded-md bg-[#2b5b63] text-[#e1f3ef] placeholder-[#a3c9c5] focus:outline-none focus:ring-2 focus:ring-[#8db5ac] transition"
            />
            <svg
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#8db5ac]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>
          </div>

          {!isAuthenticated ? (
            <button
              onClick={() => login()}
              className="flex items-center gap-2 text-sm text-white">
              <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
              Iniciar sesión
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {user?.picture && (
                <Image
                  src={user.picture}
                  alt={user.name || "User"}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              {user?.name && (
                <span className="text-sm text-white">{user.name}</span>
              )}
              <button onClick={logout} title="Cerrar sesión">
                <ArrowLeftEndOnRectangleIcon className="h-5 w-5 hover:text-red-400 transition-colors" />
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
