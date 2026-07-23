import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const trend = Array.from({ length: 24 }, (_, i) => ({
  h: `${String(i).padStart(2, "0")}:00`,
  crowd: Math.round(2000 + Math.sin(i / 2) * 900 + i * 120 + Math.random() * 300),
  predicted: Math.round(2100 + Math.sin(i / 2 + 0.4) * 950 + i * 130),
}));

const queues = [
  { name: "Q-1", occ: 62 },
  { name: "Q-2", occ: 88 },
  { name: "Q-3", occ: 41 },
  { name: "Q-4", occ: 74 },
  { name: "Q-5", occ: 96 },
  { name: "Q-6", occ: 55 },
  { name: "Q-7", occ: 33 },
];

const zones = [
  { z: "Gate A", v: 82 },
  { z: "Gate B", v: 46 },
  { z: "Darshan", v: 98 },
  { z: "Prasadam", v: 71 },
  { z: "Parking", v: 38 },
  { z: "Exit 3", v: 66 },
];

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight">{title}</h3>
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="h-56 w-full">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--color-foreground)",
} as const;

export function ChartsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCard title="Crowd Trend" subtitle="Actual vs Predicted · 24h">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="h" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="predicted" stroke="var(--color-accent)" strokeWidth={2} fill="url(#g2)" />
            <Area type="monotone" dataKey="crowd" stroke="var(--color-primary)" strokeWidth={2} fill="url(#g1)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Queue Occupancy" subtitle="Live occupancy per queue lane">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={queues} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
            <Bar dataKey="occ" radius={[6, 6, 0, 0]}>
              {queues.map((q) => (
                <Cell
                  key={q.name}
                  fill={
                    q.occ > 85
                      ? "var(--color-destructive)"
                      : q.occ > 65
                        ? "var(--color-warning)"
                        : "var(--color-primary)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Heat Zone Statistics" subtitle="Zone-level pressure index">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={zones} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="z" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="v"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "var(--color-accent)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
