import Link from "next/link";
import React from "react";
import { FaFacebookSquare, FaInstagramSquare, FaDiscord } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-[#20444c] text-[#8db5ac] text-sm z-50">
      <div className="flex justify-between items-start px-25 py-3">
        <div>
          <p className="font-semibold">Contáctanos:</p>
          <p>auxodevs@gmail.com</p>
        </div>

        <div className="text-right">
          <p className="font-semibold">Síguenos en:</p>
          <div className="flex justify-end gap-3 mt-1">
            <Link
              href={"https://www.facebook.com/"}
              className="hover:text-gray-300 transition-colors">
              <FaFacebookSquare size={20} />
            </Link>
            <Link
              href={"https://www.instagram.com/"}
              className="hover:text-gray-300 transition-colors">
              <FaInstagramSquare size={20} />
            </Link>
            <Link
              href={"https://www.discord.com/"}
              className="hover:text-gray-300 transition-colors">
              <FaDiscord size={20} />
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center w-full font-extrabold  py-2 text-xs">
        Privacidad y Derechos reservados por AUXO
      </div>
    </footer>
  );
}
