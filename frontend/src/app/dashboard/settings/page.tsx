/** @format */

"use client";
import React, { useEffect, useState } from "react";
import {
  fetchUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/controllers/authController";
import { INotificationPreferences } from "@/types/INotificationPreferences";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const SettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<INotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserNotificationPreferences()
      .then((prefs) => setPreferences(prefs))
      .catch((err) => toast.error("Failed to load preferences: " + err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof INotificationPreferences) => (value: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [field]: value });
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      await updateUserNotificationPreferences(preferences);
      toast.success("Notification preferences updated!");
    } catch (err: any) {
      toast.error("Failed to update preferences: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading your settings...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-2">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-center">
              Notification Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Risk Alerts</span>
                <Switch
                  checked={preferences?.notifyRisk}
                  onCheckedChange={handleChange("notifyRisk")}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Audit Notifications</span>
                <Switch
                  checked={preferences?.notifyAudit}
                  onCheckedChange={handleChange("notifyAudit")}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Update Notifications</span>
                <Switch
                  checked={preferences?.notifyUpdate}
                  onCheckedChange={handleChange("notifyUpdate")}
                />
              </div>
            </div>
          </div>
          <Button
            className="w-full mt-4"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
