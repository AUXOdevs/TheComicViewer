import React from "react";
import VistaBase from "@/Components/VistaBase/plantilla";

const Home = ({ usuario }: { usuario: string }) => {
  return (
    <VistaBase
      titulo={`¡Bienvenido de nuevo, ${usuario}!`}
      mensajeBienvenida="Explora nuevas aventuras, descubre tus historias favoritas y sigue donde lo dejaste."
      usuario={usuario}
    />
  );
};

export default Home;
