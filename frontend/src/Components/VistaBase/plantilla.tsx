import React from "react";
import Carrusel from "../Carrusel/carrusel";
import {
  obtenerComicsAleatorios,
  obtenerMangasAleatorios,
} from "@/utils/mock";

const VistaBase = ({
  titulo,
  mensajeBienvenida,
  
}: {
  titulo: string;
  mensajeBienvenida: string;
  usuario?: string;
}) => {
  const mangas = obtenerMangasAleatorios();
  const comics = obtenerComicsAleatorios();

  return (
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{titulo}</h1>
      <p className="text-lg mb-8">{mensajeBienvenida}</p>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">Mangas destacados</h2>
        <Carrusel items={mangas} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Cómics destacados</h2>
        <Carrusel items={comics} />
      </div>
    </div>
  );
};

export default VistaBase;
