import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type DashboardStatCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
};

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
}: DashboardStatCardProps) {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
              {title}
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {value.toLocaleString()}
            </p>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            <Icon className="size-4 sm:size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}