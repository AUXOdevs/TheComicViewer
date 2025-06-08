"use client";

import { useMemo, useState } from "react";
import { mock } from "@/utils/mock";
import  Card  from "@/Components/Card/card";
import  {Titulo } from "@/lib/type";
import { motion, AnimatePresence } from "framer-motion";

export default function MangasPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"nombre" | "fecha_de_publicacion">("nombre");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredData = useMemo<Titulo[]>(() => {
    let filtered = mock.filter((item: Titulo) => item.tipo === "Manga");

    if (search) {
      filtered = filtered.filter(item =>
        item.nombre.toLowerCase().includes(search.toLowerCase())
      );
    }

    filtered.sort((a: Titulo, b: Titulo) => {
      if (sort === "fecha_de_publicacion") {
        const dateA = new Date(a.fecha_de_publicacion).getTime();
        const dateB = new Date(b.fecha_de_publicacion).getTime();
        return order === "asc" ? dateA - dateB : dateB - dateA;
      }

      return order === "asc"
        ? a.nombre.localeCompare(b.nombre)
        : b.nombre.localeCompare(a.nombre);
    });

    return filtered;
  }, [search, sort, order]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginated = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as "nombre" | "fecha_de_publicacion");
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrder(e.target.value as "asc" | "desc");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Mangas</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={handleSearchChange}
          className="border p-2 rounded w-full sm:w-64"
        />

        <select
          value={sort}
          onChange={handleSortChange}
          className="border p-2 rounded">
          <option value="nombre">Nombre</option>
          <option value="fecha_de_publicacion">Fecha de publicación</option>
        </select>

        <select
          value={order}
          onChange={handleOrderChange}
          className="border p-2 rounded">
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {paginated.map((item: Titulo) => (
            <motion.div layout key={item.id}>
              <Card {...item} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">
          Anterior
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">
          Siguiente
        </button>
      </div>
    </div>
  );
}
