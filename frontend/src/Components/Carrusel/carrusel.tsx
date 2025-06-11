"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Titulo } from "@/lib/type";

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
    autoAdvanceRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [items.length, nextSlide]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative h-72 sm:h-96 overflow-hidden rounded-lg bg-[8db5ac]">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            aria-hidden={index !== activeIndex}>
            <Image
              src={item.imagen_url}
              alt={item.nombre}
              fill
              className="object-contain object-center"
              priority={index === activeIndex}
            />
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute z-30 flex -translate-x-1/2 bottom-3 left-1/2 space-x-2">
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

      {/* Navigation controls */}
      <button
        onClick={prevSlide}
        className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 hover:bg-white/50">
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
        className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 hover:bg-white/50">
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
