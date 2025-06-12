"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Titulo } from "@/lib/type";
import { motion } from "framer-motion";

type Props = {
  items: Titulo[];
};

const Carrusel3D = ({ items }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = () => {
    setActiveIndex(prev => (prev - 1 + items.length) % items.length);
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    autoAdvanceRef.current = setInterval(nextSlide, 8000); 
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [items.length, nextSlide]);

  const getSlideProps = (index: number) => {
    const prevIndex = (activeIndex - 1 + items.length) % items.length;
    const nextIndex = (activeIndex + 1) % items.length;

    if (index === activeIndex) {
      return {
        zIndex: 30,
        className: "scale-100 rotate-y-0",
        style: { transform: "rotateY(0deg) scale(1) translateX(0%)" },
      };
    } else if (index === prevIndex) {
      return {
        zIndex: 20,
        className: "-rotate-y-20",
        style: { transform: "rotateY(20deg) scale(0.9) translateX(-60%)" },
      };
    } else if (index === nextIndex) {
      return {
        zIndex: 20,
        className: "rotate-y-20",
        style: { transform: "rotateY(-20deg) scale(0.9) translateX(60%)" },
      };
    } else {
      return {
        zIndex: 10,
        className: "opacity-0 pointer-events-none",
        style: { transform: "scale(0.5)", opacity: 0 },
      };
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto perspective-[1000px] preserve-3d">
      <div className="relative h-72 sm:h-96 overflow-hidden">
        {items.map((item, index) => {
          const { zIndex, className, style } = getSlideProps(index);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className={`absolute top-0 left-1/2 w-2/3 h-full transform -translate-x-1/2 ${className} transition-all duration-1000 ease-in-out`}
              style={{ zIndex, ...style }}>
              <Image
                src={item.imagen_url}
                alt={item.nombre}
                fill
                className="object-contain object-center backface-hidden"
                priority={index === activeIndex}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="absolute z-40 flex -translate-x-1/2 bottom-3 left-1/2 space-x-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`w-3 h-3 rounded-full ${
              i === activeIndex ? "bg-white" : "bg-white/40"
            } transition`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="absolute top-0 left-4 z-40 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#20444c] hover:bg-[#20444c]/50 ">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 6 10">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 1 1 5l4 4"
            />
          </svg>
        </span>
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-0 right-4 z-40 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#20444c] hover:bg-[#20444c]/50">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 6 10">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 9 4-4-4-4"
            />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default Carrusel3D;
