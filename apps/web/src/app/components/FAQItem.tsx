"use client";
import { useState } from "react";

export default function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-base font-semibold text-[#f0f4fa]">{question}</span>
        <span
          className="flex-shrink-0 text-[#14b8a6] text-xl leading-none transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      {open && (
        <p className="mt-3 text-sm leading-relaxed text-[rgba(240,244,250,0.6)]">
          {answer}
        </p>
      )}
    </div>
  );
}
