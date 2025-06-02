import Image from "next/image";
import React from "react";

type Titulo = { 
    id: number,
    nombre: string,
    descripcion: string,
    autor: string,
    genero: string,
    tipo: string,
    estado: string,
    fecha_de_publicacion: string,
    imagen_url: string;
    categoria: string;
}

const Carrusel = ({ items }: { items: Titulo[] }) => {
  return (
    <div className="flex overflow-x-auto gap-4 py-2">
      {items.map(item => (
        <div
          key={item.id}
          className="min-w-[200px] bg-white rounded shadow p-2">
          <Image
            src={item.imagen_url}
            alt={item.nombre}
            fill
            className="w-full h-40 object-cover rounded"
          />
          <h3 className="text-md font-semibold mt-2">{item.nombre}</h3>
          <p className="text-sm text-gray-600">{item.autor}</p>
        </div>
      ))}
    </div>
  );
};

export default Carrusel;
