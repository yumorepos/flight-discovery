interface PriceSparklineProps {
  points: number[];
}

export default function PriceSparkline({ points }: PriceSparklineProps) {
  if (!points.length) return null;
  const width = 180;
  const height = 48;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const spread = Math.max(max - min, 1);

  const linePath = points
    .map((point, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point - min) / spread) * (height - 8) - 4;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full" role="img" aria-label="Price trend chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(124 58 237 / 0.25)" />
          <stop offset="100%" stopColor="rgb(124 58 237 / 0.02)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trend-fill)" />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-violet-600" strokeLinecap="round" />
    </svg>
  );
}
