"use client";

import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DashboardRefProps {
  dashboardRef: React.RefObject<HTMLDivElement | null>;
  isExporting: boolean;
  setIsExporting: (val: boolean) => void;
  setMessage: (val: string) => void;
}

export default function ExportPdfButton({
  dashboardRef,
  isExporting,
  setIsExporting,
  setMessage,
}: DashboardRefProps) {
  const exportPdf = async () => {
    if (!dashboardRef.current) return;

    setIsExporting(true);
    setMessage("Exporting snapshot to PDF...");

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: "#020617",
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imageData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("orbisvoice-phase-dashboard.pdf");
      setMessage("PDF export complete");
    } catch (error) {
      console.error(error);
      setMessage("PDF export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={exportPdf}
      disabled={isExporting}
      className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
    >
      {isExporting ? "Exporting..." : "Export PDF"}
    </button>
  );
}
