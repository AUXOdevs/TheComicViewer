"use client";

import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import { FaFacebookSquare, FaInstagramSquare, FaDiscord } from "react-icons/fa";

export default function Footer() {
  const [isVisible, setIsVisible] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const lastScrollY = useRef(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      }

      if (currentScrollY < 100) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;

      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      timeoutId.current = setTimeout(() => {
        setIsVisible(true);
        setIsCompact(true); 
      }, 6000);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  const footerClasses = `
    fixed bottom-0 left-0 w-full z-50 transition-all duration-500 ease-in-out 
    ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"} 
    ${isCompact ? "py-1 text-xs" : "py-3 text-sm"}
    bg-[#20444c] text-[#8db5ac]
  `;

  return (
    <footer className={footerClasses}>
      <div className="flex justify-between items-start px-6">
        <div>
          <p className="font-semibold">Contáctanos:</p>
          <p>auxodevs@gmail.com</p>
        </div>

        <div className="text-right">
          <p className="font-semibold">Síguenos en:</p>
          <div className="flex justify-end gap-3 mt-1">
            <Link
              href="https://www.facebook.com/"
              className="hover:text-gray-300 transition-colors">
              <FaFacebookSquare size={20} />
            </Link>
            <Link
              href="https://www.instagram.com/"
              className="hover:text-gray-300 transition-colors">
              <FaInstagramSquare size={20} />
            </Link>
            <Link
              href="https://www.discord.com/"
              className="hover:text-gray-300 transition-colors">
              <FaDiscord size={20} />
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center w-full font-extrabold pt-1 pb-0.5">
        Privacidad y Derechos reservados por AUXO
      </div>
    </footer>
  );
}
