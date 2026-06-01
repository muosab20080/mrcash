"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trophy, Star, Lock, Check, ShieldCheck, Globe, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Points to USD conversion
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

const levels = Array.from({ length: 20 }, (_, i) => ({
  level: i + 1,
  threshold: (i + 1) * 10000,
}));

export default function LevelsPage() {
  const { userData } = useAuth();

  const totalEarned = userData?.totalEarned || 0;
  const currentLevel = Math.floor(totalEarned / 10000) + 1;

  const currentLevelThreshold = currentLevel * 10000;
  const previousLevelThreshold = (currentLevel - 1) * 10000;
  const pointsInCurrentLevel = totalEarned - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Level Progression</h1>
          <p className="text-muted-foreground">
            Track your progress and unlock new levels as you earn more!
          </p>
        </div>

        {/* Current Level Card */}
        <Card className="glass-card border-primary/20">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl brand-gradient shadow-lg glow-primary">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl brand-gradient-text">Level {currentLevel}</CardTitle>
                  <CardDescription className="text-muted-foreground">Your current level</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-xl font-black text-primary">
                  {totalEarned.toLocaleString()} MC
                </p>
                <p className="text-xs text-muted-foreground">= ${pointsToUSD(totalEarned)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to Level {currentLevel + 1}</span>
                <span className="font-medium text-foreground">
                  {pointsInCurrentLevel.toLocaleString()} / {pointsNeededForLevel.toLocaleString()} MC
                </span>
              </div>
              <div className="h-3 w-full bg-secondary rounded-xl overflow-hidden border border-border">
                <div 
                  className="h-full brand-gradient transition-all duration-500 rounded-xl" 
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {(pointsNeededForLevel - pointsInCurrentLevel).toLocaleString()} more MC needed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary border border-border">
              <Image src="/coin.png" alt="Points" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Levels Completed</p>
              <p className="text-2xl font-black text-primary">
                {Math.max(0, currentLevel - 1)} of 20
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Next Milestone</p>
              <p className="text-lg font-bold text-foreground">
                {(currentLevel * 10000).toLocaleString()} MC
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Level Grid */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">All Levels</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {levels.map((level) => {
              const isCompleted = currentLevel > level.level;
              const isCurrent = currentLevel === level.level;
              const isLocked = currentLevel < level.level;

              return (
                <Card
                  key={level.level}
                  className={`glass-card transition-all ${
                    isCurrent
                      ? "border-primary ring-2 ring-primary/20"
                      : isCompleted
                      ? "border-emerald-500/30"
                      : "opacity-60"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            isCurrent
                              ? "brand-gradient"
                              : isCompleted
                              ? "bg-emerald-500"
                              : "bg-secondary"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : isLocked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Star className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className={`font-bold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                            Level {level.level}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {level.threshold.toLocaleString()} MC
                          </p>
                        </div>
                      </div>
                      {isCompleted && (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <Check className="h-4 w-4" />
                          <span className="text-xs font-medium">Complete</span>
                        </div>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="mt-3">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border">
                          <div 
                            className="h-full brand-gradient transition-all duration-500 rounded-full" 
                            style={{ width: `${levelProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info Card */}
        <Card className="glass-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              How Levels Work
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
                Each level requires 10,000 additional MC earned.
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
                Your level is based on your total lifetime earnings.
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">3</span>
                Complete more offers to level up faster and show off your progress!
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card/50 backdrop-blur-xl pt-12 pb-10 w-full px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-xl" />
              <span className="text-2xl font-black brand-gradient-text tracking-tight">
                MrCash
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">The premier destination for turning tasks into real digital rewards securely and instantly.</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trust</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4 text-primary" /> Secure Encryption</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Globe className="w-4 h-4 text-primary" /> Global Payouts</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Legal</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Community</h4>
            <a href="https://t.me/+HaIWYiOHx-FkNzY0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center border border-border group-hover:brand-gradient transition-colors">
                <Send className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground uppercase">Telegram</span>
                <span className="text-[10px] text-muted-foreground font-medium">Official Channel</span>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest">2026 MR.CASH - ALL RIGHTS RESERVED</p>
        </div>
      </footer>
    </div>
  );
}
