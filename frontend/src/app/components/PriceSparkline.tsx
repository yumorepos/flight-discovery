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

  const path = points
    .map((point, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point - min) / spread) * (height - 6) - 3;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full" role="img" aria-label="Price trend chart">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-violet-600" strokeLinecap="round" />
    </svg>
  );
}
