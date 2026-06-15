import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCard {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: "default" | "success" | "warning" | "danger";
  trend?: { value: number; direction: "up" | "down" };
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  stats?: StatCard[];
}

export function PageHeader({ title, description, actions, stats }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-[14px] text-foreground-secondary">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StatCardItem key={i} stat={stat} />
          ))}
        </div>
      )}
    </div>
  );
}

const colorClasses: Record<string, { bg: string; text: string }> = {
  default: { bg: "bg-accent/10", text: "text-accent" },
  success: { bg: "bg-success/10", text: "text-success" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
  danger: { bg: "bg-danger/10", text: "text-danger" },
};

function StatCardItem({ stat }: { stat: StatCard }) {
  const color = colorClasses[stat.color || "default"];
  const Icon = stat.icon;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-foreground-muted/30">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            {stat.label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </p>
            {stat.trend && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  stat.trend.direction === "up" ? "text-success" : "text-danger"
                }`}
              >
                {stat.trend.direction === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.trend.value}%
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color.bg}`}>
            <Icon className={`h-4 w-4 ${color.text}`} />
          </div>
        )}
      </div>
    </div>
  );
}
