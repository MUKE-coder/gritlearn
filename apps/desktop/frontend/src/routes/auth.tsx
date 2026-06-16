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
  // No centring container — child pages use <AuthSplitLayout> which
  // fills the whole below-titlebar area with its own two-column grid.
  return (
    <div className="flex h-screen flex-col bg-background">
      <TitleBar showSidebarControls={false} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
