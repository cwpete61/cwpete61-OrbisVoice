"use client";

interface ToggleProps {
  value: boolean;
  onChange: () => void;
}

export default function Toggle({ value, onChange }: ToggleProps) {
  return (
    <div
      onClick={onChange}
      className={`relative h-5 w-9 rounded-full cursor-pointer transition-colors ${value ? "bg-[#14b8a6]" : "bg-white/20"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </div>
  );
}
