import React, { useState, useMemo } from "react";
import { peso } from "../api.js";
import { IconBarChart } from "./Icons.jsx";

export default function SalesPerDayChart({ sales = [] }) {
  const [periodDays, setPeriodDays] = useState(14);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const chartData = useMemo(() => {
    const salesByDate = {};
    for (const s of sales) {
      if (!s.created_at) continue;
      const d = new Date(s.created_at);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!salesByDate[key]) {
        salesByDate[key] = { total: 0, count: 0 };
      }
      salesByDate[key].total += Number(s.total || 0);
      salesByDate[key].count += 1;
    }

    let anchor = new Date();
    if (sales.length > 0) {
      const validTimes = sales
        .map((s) => new Date(s.created_at).getTime())
        .filter((t) => !isNaN(t));
      if (validTimes.length > 0) {
        const latestTime = Math.max(...validTimes);
        if (latestTime > anchor.getTime()) {
          anchor = new Date(latestTime);
        }
      }
    }

    const days = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = salesByDate[key] || { total: 0, count: 0 };
      days.push({
        dateKey: key,
        rawDate: d,
        dayLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        total: entry.total,
        count: entry.count,
      });
    }

    const totalRevenue = days.reduce((sum, d) => sum + d.total, 0);
    const totalOrders = days.reduce((sum, d) => sum + d.count, 0);
    const avgDailyRevenue = days.length > 0 ? totalRevenue / days.length : 0;
    const maxDayTotal = Math.max(...days.map((d) => d.total), 0);
    const peakDay = days.find((d) => d.total === maxDayTotal && maxDayTotal > 0);

    return {
      days,
      totalRevenue,
      totalOrders,
      avgDailyRevenue,
      maxDayTotal,
      peakDay,
    };
  }, [sales, periodDays]);

  const svgWidth = 800;
  const svgHeight = 220;
  const padding = { top: 25, right: 20, bottom: 35, left: 60 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const maxVal = chartData.maxDayTotal > 0 ? chartData.maxDayTotal : 1000;
  const getNiceCeiling = (val) => {
    if (val <= 1000) return 1000;
    if (val <= 2500) return 2500;
    if (val <= 5000) return 5000;
    if (val <= 10000) return 10000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
    return Math.ceil((val * 1.15) / magnitude) * magnitude;
  };
  const yCeiling = getNiceCeiling(maxVal);

  const yTicks = [
    { val: yCeiling, y: padding.top },
    { val: Math.round(yCeiling * 0.66), y: padding.top + innerHeight * 0.34 },
    { val: Math.round(yCeiling * 0.33), y: padding.top + innerHeight * 0.67 },
    { val: 0, y: padding.top + innerHeight },
  ];

  const formatK = (amount) => {
    if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₱${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
    return `₱${amount}`;
  };

  const slotWidth = innerWidth / chartData.days.length;
  const barWidth = Math.max(8, Math.min(32, slotWidth * 0.62));

  const shouldShowLabel = (index, total) => {
    if (total <= 8) return true;
    if (total <= 15) return index % 2 === 0 || index === total - 1;
    return index % 5 === 0 || index === total - 1;
  };

  const points = chartData.days.map((day, idx) => {
    const xCenter = padding.left + (idx + 0.5) * slotWidth;
    const barH = yCeiling > 0 ? (day.total / yCeiling) * innerHeight : 0;
    const y = padding.top + innerHeight - barH;
    return { x: xCenter, y };
  });

  const linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "");
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`
    : "";

  const activeDay = hoveredIndex !== null ? chartData.days[hoveredIndex] : null;

  return (
    <div className="card sales-chart-card" style={{ marginBottom: "24px" }}>
      <div className="card-header" style={{ flexWrap: "wrap", gap: "12px", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              className="metric-icon-box"
              style={{
                width: "30px",
                height: "30px",
                background: "var(--color-primary-light)",
                color: "var(--color-primary)",
              }}
            >
              <IconBarChart size={16} />
            </div>
            <h3 className="card-title">Daily Sales Trend</h3>
          </div>
          <p className="card-subtitle">Revenue and order velocity over the last {periodDays} days</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <div className="chart-stat-pills">
            <div className="chart-stat-pill">
              <span className="stat-pill-label">Total ({periodDays}d)</span>
              <span className="stat-pill-value mono">{peso(chartData.totalRevenue)}</span>
            </div>
            <div className="chart-stat-pill">
              <span className="stat-pill-label">Daily Avg</span>
              <span className="stat-pill-value mono">{peso(chartData.avgDailyRevenue)}</span>
            </div>
          </div>

          <div className="role-pill-group">
            <button
              type="button"
              className={`role-pill-btn ${periodDays === 7 ? "active" : ""}`}
              onClick={() => {
                setPeriodDays(7);
                setHoveredIndex(null);
              }}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`role-pill-btn ${periodDays === 14 ? "active" : ""}`}
              onClick={() => {
                setPeriodDays(14);
                setHoveredIndex(null);
              }}
            >
              14 Days
            </button>
            <button
              type="button"
              className={`role-pill-btn ${periodDays === 30 ? "active" : ""}`}
              onClick={() => {
                setPeriodDays(30);
                setHoveredIndex(null);
              }}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      <div className="chart-detail-bar">
        {activeDay ? (
          <div className="chart-detail-content">
            <span className="chart-detail-date">{activeDay.fullDate}</span>
            <span className="chart-detail-divider">•</span>
            <span className="chart-detail-revenue mono">
              <strong>{peso(activeDay.total)}</strong>
            </span>
            <span className="chart-detail-divider">•</span>
            <span className="chart-detail-orders">
              {activeDay.count} {activeDay.count === 1 ? "sale" : "sales"} recorded
            </span>
          </div>
        ) : (
          <div className="chart-detail-hint">
            <span>Hover or tap any bar to view daily breakdown</span>
            {chartData.peakDay && (
              <span className="chart-peak-hint">
                • Peak day: <strong>{chartData.peakDay.dayLabel}</strong> ({peso(chartData.peakDay.total)})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="chart-svg-wrapper">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="sales-svg-chart"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
            </linearGradient>

            <linearGradient id="activeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-accent-hover)" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={svgWidth - padding.right}
                y2={tick.y}
                stroke="var(--color-divider)"
                strokeDasharray={i === yTicks.length - 1 ? "none" : "3 3"}
                strokeWidth="1"
                opacity="0.75"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                fill="var(--color-text-muted)"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {formatK(tick.val)}
              </text>
            </g>
          ))}

          {areaPath && <path d={areaPath} fill="url(#salesAreaGrad)" />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />
          )}

          {chartData.days.map((day, idx) => {
            const xCenter = padding.left + (idx + 0.5) * slotWidth;
            const x = xCenter - barWidth / 2;
            const barH = yCeiling > 0 ? (day.total / yCeiling) * innerHeight : 0;
            const y = padding.top + innerHeight - barH;
            const isHovered = hoveredIndex === idx;
            const isPeak = chartData.peakDay && chartData.peakDay.dateKey === day.dateKey;

            return (
              <g
                key={day.dateKey}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(isHovered ? null : idx)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={xCenter - slotWidth / 2}
                  y={padding.top}
                  width={slotWidth}
                  height={innerHeight}
                  fill="transparent"
                />

                <rect
                  x={x}
                  y={barH > 0 ? y : padding.top + innerHeight - 2}
                  width={barWidth}
                  height={Math.max(barH, 2)}
                  rx="3"
                  ry="3"
                  fill={isHovered ? "url(#activeBarGrad)" : isPeak ? "var(--color-primary)" : "url(#salesBarGrad)"}
                  opacity={hoveredIndex !== null && !isHovered ? 0.45 : 1}
                  style={{ transition: "all 0.15s ease" }}
                />

                <circle
                  cx={xCenter}
                  cy={y}
                  r={isHovered ? 4.5 : isPeak ? 3 : 2}
                  fill={isHovered ? "var(--color-accent)" : "var(--color-primary)"}
                  stroke="var(--color-surface)"
                  strokeWidth="1.5"
                  opacity={hoveredIndex !== null && !isHovered ? 0.3 : 1}
                />

                {shouldShowLabel(idx, chartData.days.length) && (
                  <text
                    x={xCenter}
                    y={padding.top + innerHeight + 18}
                    textAnchor="middle"
                    fill={isHovered ? "var(--color-primary)" : "var(--color-text-muted)"}
                    fontWeight={isHovered ? "700" : "500"}
                    fontSize="9.5"
                    fontFamily="Inter, sans-serif"
                  >
                    {day.dayLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

