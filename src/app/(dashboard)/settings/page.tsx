"use client";

import { useState } from "react";
import { User, Bell, Shield, Palette, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security" | "appearance">("profile");
  
  // Profile settings state
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [role, setRole] = useState("Product Designer");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("Settings updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const tabs = [
    { id: "profile", name: "Profile Details", icon: User },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "security", name: "Security & Passwords", icon: Shield },
    { id: "appearance", name: "Theme & Styling", icon: Palette },
  ] as const;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your personal preferences and configurations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Settings Navigation Sidebar */}
        <div className="flex flex-col gap-1 md:col-span-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="h-4.5 w-4.5" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Dynamic Settings Forms Panel */}
        <Card className="md:col-span-3 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">
              {tabs.find(t => t.id === activeTab)?.name}
            </CardTitle>
            <CardDescription>
              {activeTab === "profile" && "Edit your public profile account information."}
              {activeTab === "notifications" && "Choose how and when you want to receive alerts."}
              {activeTab === "security" && "Manage your login methods, credentials, and devices."}
              {activeTab === "appearance" && "Customize your default UI themes and appearance profiles."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4 border-t">
            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Job Title / Role</label>
                    <Input value={role} onChange={(e) => setRole(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button type="submit" className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 font-medium hover:bg-primary/95 transition-all shadow-sm">
                    Save Changes
                  </button>
                  {successMsg && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                      <Check className="h-4 w-4" />
                      {successMsg}
                    </span>
                  )}
                </div>
              </form>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <h4 className="text-sm font-semibold text-foreground">Email Alerts</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="notif-1" defaultChecked />
                      <label htmlFor="notif-1" className="text-sm text-muted-foreground">Weekly activity digest summaries</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="notif-2" defaultChecked />
                      <label htmlFor="notif-2" className="text-sm text-muted-foreground">Instant notifications for task assignments</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="notif-3" />
                      <label htmlFor="notif-3" className="text-sm text-muted-foreground">Reminders for tasks with upcoming due dates</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Current Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">New Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 font-medium hover:bg-primary/95 transition-all shadow-sm">
                  Change Password
                </button>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Theme Selection</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="border-2 border-primary bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl text-center">
                      <span className="text-sm font-bold block text-foreground">Auto System</span>
                      <span className="text-xs text-muted-foreground mt-0.5 block">Syncs with OS</span>
                    </button>
                    <button className="border p-4 rounded-xl text-center hover:border-primary/50">
                      <span className="text-sm font-bold block text-foreground">Light Mode</span>
                    </button>
                    <button className="border p-4 rounded-xl text-center hover:border-primary/50">
                      <span className="text-sm font-bold block text-foreground">Dark Mode</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
