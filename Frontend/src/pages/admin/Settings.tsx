import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Loader2, Save, Clock, Calendar as CalendarIcon, User as UserIcon, Camera } from "lucide-react";
import { useDarkMode } from "@/contexts/Darkmode";
import { toast } from "@/components/ui/sonner";
import api, {
  getCounselorById,
  getCounselors,
  getCounselorSettings,
  updateCounselorSettings,
  updateCounselorProfile,
  uploadProfilePicture,
} from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const SettingsPage = () => {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user } = useAuth();

  const [counselor, setCounselor] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New settings state
  const [availability, setAvailability] = useState<any[]>(
    DAYS.map((d) => ({
      day_of_week: d.value,
      start_time: "09:00:00",
      end_time: "17:00:00",
      is_enabled: d.value !== 0 && d.value !== 6, // Default Mon-Fri
    }))
  );
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  // theme colors
  const PRIMARY = "#1e3a8a";
  const GRADIENT = "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)";

  const counselorId =
    Number(counselor?.counselor_id ?? counselor?.id ?? counselor?.raw?.id) ||
    null;

  // Resolve counselor from current user or fallback
  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        if (user && user.role?.toLowerCase() === "counselor") {
          setCounselor(user);
          setProfileName(user.name || "");
          setProfileBio(user.bio || "");
          setProfilePicture(user.profile_picture || user.avatar || null);
          return;
        }
        const all = await getCounselors();
        if (all && all.length > 0) {
          const c = all[0];
          setCounselor(c);
          setProfileName(c.name || "");
          setProfileBio(c.bio || "");
          setProfilePicture(c.profile_picture || c.avatar || null);
        }
      } catch (err) {
        console.error("Failed to fetch counselor:", err);
      }
    };
    fetchCounselor();
  }, [user]);

  // Load backend settings
  useEffect(() => {
    if (counselorId) {
      const loadSettings = async () => {
        setIsLoading(true);
        try {
          const [settingsData, profileData] = await Promise.all([
            getCounselorSettings(counselorId),
            getCounselorById(counselorId)
          ]);

          if (settingsData) {
            if (settingsData.availability && settingsData.availability.length > 0) {
              const merged = DAYS.map((d) => {
                const found = settingsData.availability.find(
                  (a: any) => a.day_of_week === d.value
                );
                return found || {
                  day_of_week: d.value,
                  start_time: "09:00:00",
                  end_time: "17:00:00",
                  is_enabled: false,
                };
              });
              setAvailability(merged);
            }
            if (settingsData.sessionDuration) setSessionDuration(settingsData.sessionDuration);
          }

          if (profileData) {
            setProfileName(profileData.name || "");
            setProfileBio(profileData.bio || "");
            setProfilePicture(profileData.profile_picture || profileData.avatar || null);
          }
        } catch (err) {
          console.warn("Could not load counselor settings:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadSettings();
    }
  }, [counselorId]);

  const handleSaveSettings = async () => {
    if (!counselorId) {
      toast.error("Counselor not identified.");
      return;
    }

    setIsSaving(true);
    try {
      // Save settings (availability & duration)
      await updateCounselorSettings(counselorId, {
        availability,
        sessionDuration,
      });

      // Save profile (name & bio)
      await updateCounselorProfile(counselorId, {
        name: profileName,
        bio: profileBio,
      });

      // Upload picture if selected
      if (selectedFile) {
        const uploadRes = await uploadProfilePicture(counselorId, selectedFile);
        if (uploadRes?.profile_picture) {
          const fullPath = uploadRes.profile_picture.startsWith("http") 
            ? uploadRes.profile_picture 
            : `${import.meta.env.VITE_API_URL || "https://flamestudentcouncil.in:4000"}${uploadRes.profile_picture}`;
          setProfilePicture(fullPath);
          setSelectedFile(null);
          setPreviewUrl(null);
        }
      }

      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error("Failed to save settings: " + (err?.message ?? err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setAvailability((prev) =>
      prev.map((a) =>
        a.day_of_week === dayIndex ? { ...a, is_enabled: !a.is_enabled } : a
      )
    );
  };

  const updateTime = (dayIndex: number, field: "start_time" | "end_time", value: string) => {
    setAvailability((prev) =>
      prev.map((a) =>
        a.day_of_week === dayIndex ? { ...a, [field]: value.length === 5 ? `${value}:00` : value } : a
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-mindease-primary" />
      </div>
    );
  }

  return (
    <div
      className="p-6 pb-24 space-y-6 min-h-screen relative"
      style={{
        background: darkMode ? "#0f1724" : "#f8fafc",
        paddingTop: "5rem" // Clear the fixed user panel in AdminLayout
      }}
    >
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-mindease-primary" />
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: darkMode ? "#e6eefc" : undefined }}
          >
            Settings
          </h1>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Calendar & Availability
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <span className="h-4 w-4">🔔</span> Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <span className="h-4 w-4">⚙️</span> Preferences
          </TabsTrigger>
        </TabsList>

        {/* --- Profile Tab --- */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-500" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {previewUrl || profilePicture ? (
                      <img 
                        src={previewUrl || profilePicture || ""} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-12 w-12 text-slate-400" />
                    )}
                  </div>
                  <label 
                    htmlFor="picture-upload" 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity"
                  >
                    <Camera className="h-6 w-6" />
                  </label>
                  <input 
                    id="picture-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Click to upload a profile picture.<br/>Only JPEG, PNG or WebP (max 5MB).
                </p>
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input 
                    id="full-name" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your full name"
                    className={darkMode ? "bg-slate-800 border-slate-700" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Short Bio</Label>
                  <textarea 
                    id="bio"
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Write a short bio about yourself..."
                    className={`flex min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                  <p className="text-xs text-slate-500 italic">
                    This bio will be shown to students when they book an appointment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Calendar Tab --- */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session Duration */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Session Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Duration of each session (minutes)</Label>
                  <Select
                    value={String(sessionDuration)}
                    onValueChange={(v) => setSessionDuration(Number(v))}
                  >
                    <SelectTrigger className={darkMode ? "bg-slate-800 border-slate-700" : ""}>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Minutes</SelectItem>
                      <SelectItem value="30">30 Minutes</SelectItem>
                      <SelectItem value="45">45 Minutes</SelectItem>
                      <SelectItem value="60">1 Hour</SelectItem>
                      <SelectItem value="90">1.5 Hours</SelectItem>
                      <SelectItem value="120">2 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 italic">
                    Appointments will be split into slots of this duration.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Working Hours per Day */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  Weekly Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DAYS.map((day) => {
                    const setting = availability.find(
                      (a) => a.day_of_week === day.value
                    );
                    return (
                      <div
                        key={day.value}
                        className={`flex flex-wrap items-center justify-between p-3 rounded-lg border ${
                          setting?.is_enabled
                            ? darkMode
                              ? "bg-slate-800/50 border-slate-700"
                              : "bg-blue-50/50 border-blue-100"
                            : darkMode
                            ? "bg-slate-900 border-slate-800 opacity-50"
                            : "bg-slate-50 border-slate-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-[120px]">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={setting?.is_enabled}
                            onCheckedChange={() => toggleDay(day.value)}
                          />
                          <Label
                            htmlFor={`day-${day.value}`}
                            className="font-semibold cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>

                        {setting?.is_enabled ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 uppercase font-bold">From</span>
                              <Input
                                type="time"
                                className="w-32 h-9"
                                value={setting.start_time.slice(0, 5)}
                                onChange={(e) =>
                                  updateTime(day.value, "start_time", e.target.value)
                                }
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 uppercase font-bold">To</span>
                              <Input
                                type="time"
                                className="w-32 h-9"
                                value={setting.end_time.slice(0, 5)}
                                onChange={(e) =>
                                  updateTime(day.value, "end_time", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-medium italic text-slate-400">Unavailable</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Notifications Tab --- */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label style={{ color: darkMode ? "#cbd5e1" : undefined }}>
                  Email Notifications
                </Label>
                <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
              </div>
              <div className="flex items-center justify-between">
                <Label style={{ color: darkMode ? "#cbd5e1" : undefined }}>
                  SMS/WhatsApp Notifications
                </Label>
                <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Preferences Tab --- */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label style={{ color: darkMode ? "#cbd5e1" : undefined }}>
                  Dark Mode
                </Label>
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky Bottom Save Bar */}
      <div
        className="fixed bottom-6 right-6 left-6 md:left-auto md:w-auto z-40 transition-all"
        style={{
          pointerEvents: "none",
        }}
      >
        <div
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 justify-between md:justify-end shadow-2xl"
          style={{
            pointerEvents: "auto",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
          }}
        >
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-500">Unsaved changes? Make sure to save.</p>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="text-white font-semibold flex items-center gap-2 px-8 py-6 rounded-xl text-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              background: GRADIENT,
              boxShadow: "0 8px 30px rgba(30,58,138,0.3)",
            }}
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Save All Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
