import React from "react";
import Carrusel from "../Carrusel/carrusel";
import { obtenerComicsAleatorios, obtenerMangasAleatorios } from "@/utils/mock";

const VistaBase = ({
  titulo,
  mensajeBienvenida,
}: {
  titulo: string;
  mensajeBienvenida: string;
}) => {
  const mangas = obtenerMangasAleatorios();
  const comics = obtenerComicsAleatorios();

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{titulo}</h1>

      <div className="bg-[#ba681c] text-black rounded-xl shadow-lg p-4 mb-8">
        <p>{mensajeBienvenida}</p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-2 text-[#ba681c]">
          Mangas destacados
        </h2>
        <div className="bg-[#ba681c] text-black rounded-xl shadow-lg p-4 mb-4">
          <p>
            Disfruta de los mangas más populares y emocionantes del momento.
            Desde shonen hasta seinen, descubre nuevas historias visuales.
          </p>
        </div>
        <Carrusel items={mangas} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2 text-[#ba681c]">
          Cómics destacados
        </h2>
        <div className="bg-[#ba681c] text-black rounded-xl shadow-lg p-4 mb-4">
          <p>
            Explora nuestro catálogo de cómics, con héroes legendarios,
            universos épicos y narrativas inolvidables de Marvel, DC y más.
          </p>
        </div>
        <Carrusel items={comics} />
      </div>
    </div>
  );
};

export default VistaBase;
