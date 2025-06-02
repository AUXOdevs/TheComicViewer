"use client";
import React, { useState } from "react";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/16/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#20444c] text-[#8db5ac] px-6 py-4 shadow-md z-50">
      
      <div className="flex items-center justify-between">
        <Link href="/">
          <div className="text-lg font-semibold hover:text-gray-300 transition-colors">
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
          <a href="#comic" className="hover:text-gray-300 transition-colors">
            Comic
          </a>
          <a href="#manga" className="hover:text-gray-300 transition-colors">
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
          <button>
            <ArrowLeftEndOnRectangleIcon className="h-6 w-6 hover:text-gray-300 transition-colors" />
          </button>
        </div>
      </div>

     
      {isOpen && (
        <div className="sm:hidden mt-4 flex flex-col gap-4">
          <a href="#comic" className="hover:text-gray-300 transition-colors">
            Comic
          </a>
          <a href="#manga" className="hover:text-gray-300 transition-colors">
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
          <button className="self-start">
            <ArrowLeftEndOnRectangleIcon className="h-6 w-6 hover:text-gray-300 transition-colors" />
          </button>
        </div>
      )}
    </nav>
  );
}
