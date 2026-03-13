"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import { cn } from "@/lib/utils";

export type LayoutGridCard = {
  id: number;
  content: React.ReactNode;
  className: string;
  thumbnail: string;
};

export const LayoutGrid = ({ cards }: { cards: LayoutGridCard[] }) => {
  const [selected, setSelected] = useState<LayoutGridCard | null>(null);
  const [lastSelected, setLastSelected] = useState<LayoutGridCard | null>(null);

  const handleClick = (card: LayoutGridCard) => {
    setLastSelected(selected);
    setSelected(card);
  };

  const handleOutsideClick = () => {
    setLastSelected(selected);
    setSelected(null);
  };

  return (
    <div className="relative mx-auto grid h-full w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div key={card.id} className={cn(card.className)}>
          <motion.div
            onClick={() => handleClick(card)}
            className={cn(
              "relative h-full w-full overflow-hidden",
              selected?.id === card.id
                ? "absolute inset-0 z-50 m-auto flex h-[28rem] w-full cursor-pointer flex-col justify-center rounded-[1.8rem] md:h-1/2 md:w-1/2"
                : lastSelected?.id === card.id
                  ? "z-40 rounded-[1.8rem] bg-white"
                  : "rounded-[1.8rem] bg-white",
            )}
            layoutId={`card-${card.id}`}
          >
            {selected?.id === card.id ? <SelectedCard selected={selected} /> : null}
            <ImageComponent card={card} />
          </motion.div>
        </div>
      ))}
      <motion.button
        type="button"
        onClick={handleOutsideClick}
        className={cn(
          "absolute left-0 top-0 z-10 h-full w-full cursor-default bg-black opacity-0",
          selected?.id ? "pointer-events-auto" : "pointer-events-none",
        )}
        animate={{ opacity: selected?.id ? 0.34 : 0 }}
        aria-label="Закрыть раскрытую карточку"
      />
    </div>
  );
};

const ImageComponent = ({ card }: { card: LayoutGridCard }) => {
  return (
    <motion.div layoutId={`image-${card.id}-image`} className="absolute inset-0">
      <Image
        src={card.thumbnail}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="absolute inset-0 h-full w-full object-cover object-center transition duration-200"
        alt="Карточка направления"
      />
    </motion.div>
  );
};

const SelectedCard = ({ selected }: { selected: LayoutGridCard | null }) => {
  return (
    <div className="relative z-[60] flex h-full w-full flex-col justify-end rounded-[1.8rem] shadow-2xl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.62 }}
        className="absolute inset-0 z-10 h-full w-full bg-black"
      />
      <motion.div
        layoutId={`content-${selected?.id}`}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative z-[70] px-8 pb-6"
      >
        {selected?.content}
      </motion.div>
    </div>
  );
};
