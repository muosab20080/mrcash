"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Gift, History, Globe } from "lucide-react";
import Image from "next/image";

interface OfferRecord {
  id: string;
  offerName: string;
  offerwallName: string;
  points: number;
  createdAt: Date | null;
}

interface WithdrawalRecord {
  id: string;
  amountUSD: number;
  pointsDeducted: number;
  method: string;
  status: string;
  ipAddress: string | null;
  createdAt: Date | null;
}

function formatDate(date: Date | null) {
  if (!date) return "N/A";
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };
  return (
    <Badge className={`rounded-lg px-2.5 py-0.5 text-[10px] uppercase font-bold border ${styles[status] || styles.pending}`}>
      {status}
    </Badge>
  );
}

export function ActivityLog({ userId }: { userId: string }) {
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const offersQuery = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const unsubOffers = onSnapshot(
      offersQuery,
      (snap) => {
        setOffers(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              offerName: data.offerName || "Offer",
              offerwallName: data.offerwallName || data.offerwall || "Unknown",
              points: data.points || 0,
              createdAt: data.createdAt?.toDate?.() || null,
            };
          })
        );
        setLoadingOffers(false);
      },
      () => setLoadingOffers(false)
    );

    const withdrawalsQuery = query(
      collection(db, "withdrawals"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const unsubWithdrawals = onSnapshot(
      withdrawalsQuery,
      (snap) => {
        setWithdrawals(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              amountUSD: data.amountUSD || 0,
              pointsDeducted: data.pointsDeducted || 0,
              method: data.method || "Unknown",
              status: data.status || "pending",
              ipAddress: data.ipAddress || null,
              createdAt: data.createdAt?.toDate?.() || null,
            };
          })
        );
        setLoadingWithdrawals(false);
      },
      () => setLoadingWithdrawals(false)
    );

    return () => {
      unsubOffers();
      unsubWithdrawals();
    };
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* Offers Log */}
      <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Completed Offers
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Offers you completed and the points you received
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loadingOffers ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : offers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No completed offers yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Offer</TableHead>
                    <TableHead className="text-muted-foreground">Provider</TableHead>
                    <TableHead className="text-muted-foreground text-right">Points</TableHead>
                    <TableHead className="text-muted-foreground text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((o) => (
                    <TableRow key={o.id} className="border-border">
                      <TableCell className="font-medium text-foreground max-w-[180px] truncate">{o.offerName}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{o.offerwallName}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-primary">
                          <Image src="/coin.png" alt="" width={14} height={14} className="w-3.5 h-3.5" />
                          +{o.points.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawals Log */}
      <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-lg">
            <History className="h-5 w-5 text-primary" />
            Withdrawal History
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your withdrawal requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loadingWithdrawals ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No withdrawal history yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Method</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">IP Address</TableHead>
                    <TableHead className="text-muted-foreground text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id} className="border-border">
                      <TableCell className="font-bold text-foreground">
                        ${w.amountUSD.toFixed(2)}
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {w.pointsDeducted.toLocaleString()} PTS
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{w.method}</TableCell>
                      <TableCell>{statusBadge(w.status)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          {w.ipAddress || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">{formatDate(w.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
