"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Trophy,
  Calendar,
  Shield,
  Loader2,
  Save,
  Copy,
  Camera,
  TrendingUp,
  History,
  Globe,
  Monitor,
  Download,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AvatarSelector } from "@/components/avatar-selector";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";

// Points to USD conversion
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

interface LoginHistoryEntry {
  id: string;
  ip: string;
  country: string;
  userAgent: string;
  timestamp: Date;
}

type TabType = "account" | "security" | "history";

export default function ProfilePage() {
  const { userData, updateUserProfile, updateUserEmail, updateUserPassword, updateUserAvatar, logout, user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("account");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(userData?.username || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(userData?.photoURL || null);
  
  // Login history state
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const currentLevelThreshold = (userData?.level || 1) * 10000;
  const previousLevelThreshold = ((userData?.level || 1) - 1) * 10000;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

  // Load login history when tab changes
  useEffect(() => {
    if (activeTab === "history" && userData?.uid && loginHistory.length === 0) {
      loadLoginHistory();
    }
  }, [activeTab, userData?.uid]);

  const loadLoginHistory = async () => {
    if (!userData?.uid) return;
    
    setHistoryLoading(true);
    try {
      const historyRef = collection(db, "loginHistory");
      const q = query(
        historyRef,
        where("userId", "==", userData.uid),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const entries: LoginHistoryEntry[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ip: data.ip,
          country: data.country,
          userAgent: data.userAgent,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        };
      });
      
      setLoginHistory(entries);
    } catch (error) {
      console.error("Failed to load login history:", error);
      toast.error("Failed to load login history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setLoading("username");
    try {
      await updateUserProfile(username);
      toast.success("Username updated successfully");
    } catch {
      toast.error("Failed to update username");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      toast.error("Email cannot be empty");
      return;
    }

    setLoading("email");
    try {
      await updateUserEmail(email);
      toast.success("Email updated successfully");
    } catch {
      toast.error("Failed to update email. You may need to re-login.");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading("password");
    try {
      await updateUserPassword(newPassword);
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to update password. You may need to re-login.");
    } finally {
      setLoading(null);
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || selectedAvatar === userData?.photoURL) {
      toast.info("No changes to save");
      return;
    }

    setLoading("avatar");
    try {
      await updateUserAvatar(selectedAvatar);
      toast.success("Avatar updated successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update avatar";
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const copyUserId = async () => {
    if (userData?.uid) {
      await navigator.clipboard.writeText(userData.uid);
      toast.success("User ID copied to clipboard");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData?.uid) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please use PNG or JPEG only.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Max 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading("avatar-upload");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userData.uid);

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url } = await response.json();
      await updateUserAvatar(url);
      setSelectedAvatar(url);
      toast.success("Profile picture updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
    } finally {
      setLoading(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handle2FAComplete = () => {
    window.location.reload();
  };

  // Parse user agent to get device info
  const parseUserAgent = (ua: string): string => {
    if (ua.includes("Mobile")) return "Mobile";
    if (ua.includes("Tablet")) return "Tablet";
    return "Desktop";
  };

  const tabs = [
    { id: "account" as TabType, label: "Account", icon: User },
    { id: "security" as TabType, label: "Security", icon: Shield },
    { id: "history" as TabType, label: "Login History", icon: History },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header with Avatar */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-primary/30 rounded-xl">
            <AvatarImage src={userData?.photoURL || ""} alt={userData?.username || "User"} className="rounded-xl" />
            <AvatarFallback className="text-2xl brand-gradient text-white rounded-xl">
              {userData?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading === "avatar-upload"}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === "avatar-upload" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-bold text-foreground">{userData?.username || "Profile"}</h1>
          <p className="text-muted-foreground">
            Manage your account settings and security
          </p>
          <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
            <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg px-2 py-0.5">
              <Trophy className="mr-1 h-3 w-3" />
              Level {userData?.level || 1}
            </Badge>
            {userData?.twoFactorEnabled && (
              <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-2 py-0.5">
                <Shield className="mr-1 h-3 w-3" />
                2FA Enabled
              </Badge>
            )}
            {userData?.isAdmin && (
              <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-2 py-0.5">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary border border-border">
              <Image src="/coin.png" alt="Points" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-2xl font-black text-foreground">
                {(userData?.points || 0).toLocaleString()}
              </p>
              <p className="text-xs text-primary">= ${pointsToUSD(userData?.points || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Trophy className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="text-2xl font-black text-amber-500">
                {userData?.level || 1}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl brand-gradient shadow-lg glow-primary">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-black text-primary">
                {(userData?.totalEarned || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">= ${pointsToUSD(userData?.totalEarned || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary border border-border">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="text-lg font-bold text-foreground">
                {userData?.createdAt?.toLocaleDateString() || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-foreground">Level {userData?.level || 1} Progress</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {pointsInCurrentLevel.toLocaleString()} / {pointsNeededForLevel.toLocaleString()} MC
            </span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-xl overflow-hidden border border-border">
            <div 
              className="h-full brand-gradient transition-all duration-500 rounded-xl" 
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 rounded-xl bg-secondary/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* User ID */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">User ID</p>
                <div className="flex gap-2">
                  <Input
                    value={userData?.uid || ""}
                    readOnly
                    className="font-mono text-sm h-12 rounded-xl bg-secondary/30 border-border"
                  />
                  <Button variant="outline" onClick={copyUserId} className="rounded-xl h-12 border-border hover:bg-secondary">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Username */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <User className="h-5 w-5 text-primary" />
                Update Username
              </CardTitle>
              <CardDescription className="text-muted-foreground">Change your display name</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex gap-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
                />
                <Button
                  onClick={handleUpdateUsername}
                  disabled={loading === "username"}
                  className="brand-gradient text-white h-12 rounded-xl px-6"
                >
                  {loading === "username" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Update Email */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Update Email
              </CardTitle>
              <CardDescription className="text-muted-foreground">Change your email address</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter new email"
                  className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
                />
                <Button
                  onClick={handleUpdateEmail}
                  disabled={loading === "email"}
                  className="brand-gradient text-white h-12 rounded-xl px-6"
                >
                  {loading === "email" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Selection */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Camera className="h-5 w-5 text-primary" />
                Change Avatar
              </CardTitle>
              <CardDescription className="text-muted-foreground">Select from our avatar collection</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <AvatarSelector
                selectedAvatar={selectedAvatar}
                onSelect={setSelectedAvatar}
              />
              <Button
                onClick={handleSaveAvatar}
                disabled={loading === "avatar" || selectedAvatar === userData?.photoURL}
                className="w-full h-12 rounded-xl brand-gradient text-white font-bold"
              >
                {loading === "avatar" ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Avatar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* PWA Install */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Download className="h-5 w-5 text-primary" />
                Install App
              </CardTitle>
              <CardDescription className="text-muted-foreground">Get the MrCash app on your device</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <PWAInstallButton variant="card" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Update Password */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Lock className="h-5 w-5 text-primary" />
                Update Password
              </CardTitle>
              <CardDescription className="text-muted-foreground">Change your account password</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
              />
              <Button
                onClick={handleUpdatePassword}
                disabled={loading === "password"}
                className="brand-gradient text-white h-12 rounded-xl w-full"
              >
                {loading === "password" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <TwoFactorSetup
                userId={userData?.uid || ""}
                email={userData?.email || ""}
                isEnabled={userData?.twoFactorEnabled || false}
                onComplete={handle2FAComplete}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <History className="h-5 w-5 text-primary" />
                Recent Login Activity
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your login history from the last 20 sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : loginHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No login history available yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Your login activity will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loginHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary border border-border">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{entry.country}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Monitor className="h-3 w-3" />
                            <span>{parseUserAgent(entry.userAgent)}</span>
                            <span className="text-muted-foreground/50">|</span>
                            <span className="font-mono">{entry.ip}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {entry.timestamp.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logout */}
      <Card className="backdrop-blur-xl bg-background/40 border border-destructive/20">
        <CardContent className="p-5">
          <Button
            variant="destructive"
            onClick={logout}
            className="w-full h-12 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
