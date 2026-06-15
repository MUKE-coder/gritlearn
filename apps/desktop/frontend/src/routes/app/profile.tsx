import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useMe } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: user } = useMe();

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account details" />

      <Card className="mt-6 max-w-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-xl font-semibold text-accent">
                {user?.first_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[13px] text-foreground-secondary">{user?.email}</p>
              <p className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-wider text-accent">
                {user?.role}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
