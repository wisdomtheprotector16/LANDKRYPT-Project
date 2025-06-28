"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Charts = ({ dashboardStats, isLoading }) => {
  const [timeframe, setTimeframe] = useState("Last 6 months");

  // Use real data from dashboard stats or fallback to demo data
  const returnsData = dashboardStats?.activity?.returnsData || [
    { month: "Jan", value: 100, date: "Jan 2024" },
    { month: "Feb", value: 150, date: "Feb 2024" },
    { month: "Mar", value: 250, date: "Mar 2024" },
    { month: "Apr", value: 400, date: "Apr 2024" },
    { month: "May", value: 680, date: "May 2024" },
    { month: "Jun", value: 520, date: "Jun 2024" },
    { month: "Jul", value: 400, date: "Jul 2024" },
    { month: "Aug", value: 350, date: "Aug 2024" },
    { month: "Sep", value: 320, date: "Sep 2024" },
  ];

  const peakValue = returnsData.reduce((peak, current) => 
    current.value > peak.value ? current : peak, 
    { value: 0, date: "N/A", amount: "$0" }
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-lg">
          <p className="text-gray-300 text-sm">{data.date}</p>
          <p className="text-blue-400 font-semibold">${data.value}</p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.value === peakValue.value) {
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r="6"
            fill="#3b82f6"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <circle cx={cx} cy={cy} r="3" fill="#60a5fa" />
        </g>
      );
    }
    return null;
  };

  const PeakValueLabel = () => {
    const peakDataPoint = returnsData.find(
      (d) => d.value === peakValue.value
    );
    if (!peakDataPoint) return null;

    return (
      <div className="absolute top-4 left-20 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
        <div className="text-xs opacity-90">{peakValue.date}</div>
        <div className="font-bold">${peakValue.value}</div>
        <div className="absolute -bottom-1 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
      </div>
    );
  };

  return (
    <div className=" ">
      <div className=" mx-auto grid grid-cols-1  gap-6">
        {/* Returns Over Time Chart */}
        <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Returns Over Time</h2>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Last 6 months</option>
              <option>Last 12 months</option>
              <option>Last 2 years</option>
            </select>
          </div>

          <div className="relative h-80 bg-gray-900 rounded-xl overflow-hidden">
            <PeakValueLabel />
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={returnsData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={{ stroke: "#4b5563" }}
                  tickLine={{ stroke: "#4b5563" }}
                />
                <YAxis
                  domain={[0, "dataMax"]}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={{ stroke: "#4b5563" }}
                  tickLine={{ stroke: "#4b5563" }}
                  tickFormatter={(value) => `${value}`}
                />
                <CartesianGrid
                  stroke="#374151"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorReturns)"
                  dot={<CustomDot />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
