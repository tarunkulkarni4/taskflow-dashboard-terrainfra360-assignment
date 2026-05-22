"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CheckSquare, FolderOpen, Calendar, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Calendar", href: "/calendar", icon: Calendar },
];

export function Sidebar({ className, onNavClick }: { className?: string, onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      toast.success("Logged out successfully");
      if (onNavClick) onNavClick();
    } catch (error) {
      console.error("Error logging out", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <div className={cn("flex h-full w-64 flex-col border-r bg-card px-3 py-4 text-card-foreground shadow-sm", className)}>
      <div className="mb-8 flex items-center px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow">
          <CheckSquare className="h-4 w-4" />
        </div>
        <span className="ml-3 text-lg font-semibold tracking-tight">TaskFlow</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <Link
          href="/settings"
          onClick={onNavClick}
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
          Logout
        </button>
      </div>
    </div>
  );
}
