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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#14b8a6] shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
          <p className="text-lg font-black text-white">{payload[0].value} <span className="text-[10px] text-gray-500 font-medium lowercase">Convs</span></p>
        </div>
      </div>
    );
  }
  return null;
};

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
          // Pad data if too short for a nice graph
          let chartData = result.data || [];
          if (chartData.length < 5 && chartData.length > 0) {
            // Add some zero points for visual flow if it's very new data
             const firstDate = new Date(chartData[0].date);
             for(let i=1; i<=5; i++) {
                const prev = new Date(firstDate);
                prev.setDate(prev.getDate() - i);
                chartData.unshift({ date: prev.toLocaleDateString(), count: 0 });
             }
          }
          setData(chartData);
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
      <div className="h-[250px] w-full bg-white/[0.01] border border-white/[0.05] rounded-3xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#14b8a6]/20 border-t-[#14b8a6] rounded-full animate-spin" />
          <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            Analyzing Traffic...
          </div>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.count), 0);
  const totalConvs = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="h-[300px] w-full bg-[#0c111d] border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden group/chart mb-8">
      {/* Background Decorative Elements */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#14b8a6]/5 rounded-full blur-[80px] group-hover/chart:bg-[#14b8a6]/10 transition-colors duration-700" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
      
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h3 className="text-sm font-black text-white uppercase tracking-wider">Conversation Volume</h3>
             <span className="px-2 py-0.5 rounded-full bg-[#14b8a6]/10 border border-[#14b8a6]/20 text-[#14b8a6] text-[8px] font-black uppercase">Live</span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">Daily operational transparency over 30 days</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Total Payload</p>
           <p className="text-xl font-black text-white tracking-tighter">{totalConvs.toLocaleString()}</p>
        </div>
      </div>

      <div className="h-40 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#ffffff03" vertical={false} />
            <XAxis 
              dataKey="date" 
              hide 
            />
            <YAxis 
              stroke="#ffffff10" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}`}
              width={25}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff10', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#14b8a6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCount)"
              animationDuration={1500}
              dot={{ r: 0 }}
              activeDot={{ r: 4, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] px-1 relative z-10">
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
            <span>{data[0]?.date || 'History Start'}</span>
        </div>
        <div className="flex items-center gap-2">
            <span>Today</span>
            <div className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
