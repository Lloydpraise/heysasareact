// Simple 2-column detail table used in drawer bodies, ported from
// analytics.js's .an-dtable (both the funnel state-breakdown drawer and
// the health-metrics drawer use this same shape).
export default function DTable({ rows }) {
  return (
    <table className="w-full text-[12.5px]">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 last:border-0">
            <td className="py-2 pr-3 text-slate-500">{r.label}</td>
            <td className="py-2 text-right font-semibold text-slate-900">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}