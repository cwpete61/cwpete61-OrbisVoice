"use client";

import { useState } from "react";

export type OriginalFaqItem = {
  q: string;
  a: string;
};

export default function OriginalFAQAccordion({ items }: { items: OriginalFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq-right">
      {items.map((item, idx) => {
        const open = idx === openIndex;
        return (
          <div key={item.q} className={`faq-item${open ? " open" : ""}`}>
            <div
              className="faq-q"
              role="button"
              tabIndex={0}
              onClick={() => setOpenIndex(open ? -1 : idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenIndex(open ? -1 : idx);
                }
              }}
            >
              <span className="faq-q-text">{item.q}</span>
              <span className="faq-icon" aria-hidden>
                +
              </span>
            </div>
            <div className="faq-a">{item.a}</div>
          </div>
        );
      })}
    </div>
  );
}
