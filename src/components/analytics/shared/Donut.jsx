import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Generic donut for any {pct, color}[] segment list. Used for objections
// today; the original analytics.js reuses the same buildDonut() pattern
// for AI-vs-human closes and read-receipt breakdowns too, so this is
// intentionally not objection-specific.
export default function Donut({ segments, size = 120, thickness = 16 }) {
  if (!segments || segments.length === 0) return null;
  const data = segments.map((s) => ({ value: s.pct, color: s.color }));

  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}