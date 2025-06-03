"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";

type Titulo = {
  id: number;
  nombre: string;
  descripcion: string;
  autor: string;
  genero: string;
  tipo: string;
  estado: string;
  fecha_de_publicacion: string;
  imagen_url: string;
  categoria: string;
};

const Carrusel = ({ items }: { items: Titulo[] }) => {
  return (
    <div className="overflow-x-hidden">
      <motion.div
        className="flex gap-4 py-4 px-4 cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: -1000, right: 0 }}>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className="min-w-[200px] bg-white rounded-lg shadow-md p-2 flex-shrink-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}>
            <div className="relative w-full h-40 rounded overflow-hidden">
              <Image
                src={item.imagen_url}
                alt={item.nombre}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 200px"
              />
            </div>
            <h3 className="text-md font-semibold mt-2 truncate">
              {item.nombre}
            </h3>
            <p className="text-sm text-gray-600 truncate">{item.autor}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Carrusel;
