"use client";

type Point = {
  label: string;
  value: number;
};

export function DashboardLineChart({
  points,
  stroke = "#E57C23"
}: {
  points: Point[];
  stroke?: string;
}) {
  const width = 720;
  const height = 240;
  const paddingX = 28;
  const paddingTop = 24;
  const paddingBottom = 44;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const levels = [0, 0.25, 0.5, 0.75, 1];

  const coords = points.map((point, index) => {
    const x = paddingX + (innerWidth / Math.max(points.length - 1, 1)) * index;
    const y = paddingTop + innerHeight - (point.value / maxValue) * innerHeight;
    return { ...point, x, y };
  });

  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${coords.at(-1)?.x ?? paddingX} ${paddingTop + innerHeight} L ${coords[0]?.x ?? paddingX} ${paddingTop + innerHeight} Z`;

  return (
    <div className="rounded-[28px] border border-navy-100 bg-navy-50/45 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full">
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {levels.map((ratio) => {
          const y = paddingTop + innerHeight - innerHeight * ratio;
          return (
            <g key={ratio}>
              <line x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="#D9E4F2" strokeDasharray="4 8" />
              <text x={8} y={y + 5} fontSize="13" fontWeight="700" fill="#61738A">
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          );
        })}

        <line x1={paddingX} x2={width - paddingX} y1={paddingTop + innerHeight} y2={paddingTop + innerHeight} stroke="#C8D8EA" />

        <path d={areaPath} fill="url(#chart-fill)" />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {coords.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="white" stroke={stroke} strokeWidth="3" />
            <text x={point.x} y={height - 8} textAnchor="middle" fontSize="15" fontWeight="700" fill="#112033">
              {point.label}
            </text>
            <text x={point.x} y={point.y - 14} textAnchor="middle" fontSize="13" fontWeight="700" fill={stroke}>
              {point.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
