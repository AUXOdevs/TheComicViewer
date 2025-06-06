"use client";

import React from "react";
import Image from "next/image";

type BookCardProps = {
  imagen_url: string;
  nombre: string;
  descripcion: string;
  estado: string;
  autor: string;
};

const BookCard = ({
  imagen_url,
  nombre,
  descripcion,
  estado,
  autor,
}: BookCardProps) => {
  return (
    <div className="relative w-[220px] h-[300px] bg-white rounded-lg [perspective:2000px] group overflow-visible">
      {/* Parte trasera (contenido) */}
      <div className="absolute inset-0 rounded-lg bg-white p-4 text-black flex flex-col justify-center items-start [backface-visibility:hidden] z-0">
        <h3 className="text-lg font-bold mb-1">{nombre}</h3>
        <p className="text-sm text-gray-700 mb-2 line-clamp-3">{descripcion}</p>
        <p className="text-xs font-semibold text-gray-600">Estado: {estado}</p>
        <p className="text-xs text-gray-600">Autor: {autor}</p>
      </div>

      {/* Parte frontal (portada) */}
      <div className="absolute inset-0 rounded-lg overflow-hidden shadow-lg transition-transform duration-700 ease-in-out origin-left [transform-style:preserve-3d] group-hover:[transform:rotateY(-120deg)] z-10 bg-gray-200">
        <Image
          src={imagen_url}
          alt={nombre}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 200px"
        />
      </div>
    </div>
  );
};

export default BookCard;
