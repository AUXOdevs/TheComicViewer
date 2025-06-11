"use client";

import { useState, useMemo } from "react";
import { mock } from "@/utils/mock";
import  Card  from "@/Components/Card/card";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 12;

export default function Comics() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"nombre" | "fecha_de_publicacion">("nombre");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const filteredData = useMemo(() => {
    let filtered = mock.filter(item => item.tipo === "Comic");

    if (search) {
      filtered = filtered.filter(item =>
        item.nombre.toLowerCase().includes(search.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const valA = a[sort];
      const valB = b[sort];

      if (sort === "fecha_de_publicacion") {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return order === "asc" ? dateA - dateB : dateB - dateA;
      }

      return order === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

    return filtered;
  }, [search, sort, order]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, page]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center justify-between flex-wrap">
        <input
          className="border p-2 rounded"
          placeholder="Buscar cómic..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as "nombre" | "fecha_de_publicacion")}
          className="p-2 border rounded">
          <option value="nombre">Nombre</option>
          <option value="fecha_de_publicacion">Fecha</option>
        </select>
        <select
          value={order}
          onChange={e => setOrder(e.target.value as "asc" | "desc")}
          className="p-2 border rounded">
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
      </div>

      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginated.map(item => (
          <motion.div layout key={item.id}>
            <Card {...item} />
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50">
          Anterior
        </button>
        <span className="px-3 py-1">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50">
          Siguiente
        </button>
      </div>
    </div>
  );
}
