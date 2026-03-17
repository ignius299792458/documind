"use client";

import { Sidebar } from "@/components/sidebar";
import { SettingsView } from "@/components/settings/settings-view";

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <SettingsView />
    </div>
  );
}
