"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE } from "@/lib/api";

interface ChartData {
  date: string;
  count: number;
}

export default function UsageChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/stats/usage-trend`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch usage trend:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] w-full bg-white/[0.02] border border-white/[0.05] rounded-3xl flex items-center justify-center">
        <div className="animate-pulse text-gray-500 text-sm font-bold uppercase tracking-widest">
          Calibrating Analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full bg-[#0c111d] border border-white/[0.07] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-[#14b8a6]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative">
        <div>
          <h3 className="text-lg font-bold text-white">Conversation Volume</h3>
          <p className="text-xs text-gray-500 mt-1">Daily trend over the last 30 days</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#14b8a6]/10 border border-[#14b8a6]/20 text-[#14b8a6] text-[10px] font-black uppercase tracking-tighter">
          Real-time Engine
        </div>
      </div>

      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="date" 
              hide 
            />
            <YAxis 
              stroke="#ffffff20" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1f2e",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff",
              }}
              itemStyle={{ color: "#14b8a6", fontWeight: "bold" }}
              labelStyle={{ color: "#9ca3af", marginBottom: "4px" }}
              cursor={{ stroke: '#14b8a650', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#14b8a6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCount)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest px-2">
        <span>{data[0]?.date}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
