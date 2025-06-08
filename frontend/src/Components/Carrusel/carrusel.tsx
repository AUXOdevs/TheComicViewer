"use client";

import React from "react";
import { motion } from "framer-motion";
import Card from "../Card/card";
import { Titulo } from "@/lib/type";

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}>
            <Card {...item} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Carrusel;
