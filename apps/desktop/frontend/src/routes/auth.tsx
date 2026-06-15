import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { TitleBar } from "@/components/layout/title-bar";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const { getToken } = await import("@/lib/wails-bridge");
    const token = await getToken("access_token");
    if (token) {
      throw redirect({ to: "/app" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TitleBar showSidebarControls={false} />
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
