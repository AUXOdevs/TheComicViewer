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

const Card = ({
  imagen_url,
  nombre,
  descripcion,
  estado,
  autor,
}: BookCardProps) => {
  
  return (
    <div className="relative w-[220px] h-[300px] [perspective:2000px] group">
      <div className="relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* Parte frontal */}
        <div className="absolute w-full h-full backface-hidden rounded-lg overflow-hidden shadow-lg">
          <Image
            src={imagen_url}
            alt={nombre}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 220px"
          />
        </div>

        {/* Parte trasera */}
        <div className="absolute w-full h-full backface-hidden [transform:rotateY(180deg)] bg-white rounded-lg p-4 text-black flex flex-col justify-center items-start">
          <h3 className="text-lg font-bold mb-1">{nombre}</h3>
          <p className="text-sm text-gray-700 mb-2 line-clamp-3">
            {descripcion}
          </p>
          <p className="text-xs font-semibold text-gray-600">
            Estado: {estado}
          </p>
          <p className="text-xs text-gray-600">Autor: {autor}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;
