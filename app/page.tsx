"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProposalCard } from "@/components/proposal/ProposalCard";
import type { ProposalWithMessages } from "@/lib/types";
import Link from "next/link";
import { Bot, RefreshCw, Search, Import } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { WalletNudgeDialog } from "@/components/wallet/WalletNudgeDialog";

export default function Home() {
  const router = useRouter();
  const [searchId, setSearchId] = useState("");
  const [activeProposals, setActiveProposals] = useState<
    ProposalWithMessages[]
  >([]);
  const [importedProposals, setImportedProposals] = useState<
    ProposalWithMessages[]
  >([]);
  const [allActiveProposals, setAllActiveProposals] = useState<
    ProposalWithMessages[]
  >([]);
  const [allImportedProposals, setAllImportedProposals] = useState<
    ProposalWithMessages[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeSearch, setActiveSearch] = useState("");
  const [importedSearch, setImportedSearch] = useState("");
  const [importId, setImportId] = useState("");
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [walletNudgeOpen, setWalletNudgeOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{
    address: string;
    name?: string;
    source: string;
    type?: string;
    genesisHash?: string;
  } | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/proposals`);
      if (response.ok) {
        const data = await response.json();
        setAllActiveProposals(data.activeProposals || []);
        setAllImportedProposals(data.importedProposals || []);
        setActiveProposals(data.activeProposals || []);
        setImportedProposals(data.importedProposals || []);
      }
    } catch {
      toast.error("Failed to load proposals. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    const q = activeSearch.trim().toLowerCase();
    if (!q) {
      setActiveProposals(allActiveProposals);
    } else {
      setActiveProposals(
        allActiveProposals.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.chainId.toLowerCase().includes(q)
        )
      );
    }
  }, [activeSearch, allActiveProposals]);

  useEffect(() => {
    const q = importedSearch.trim().toLowerCase();
    if (!q) {
      setImportedProposals(allImportedProposals);
    } else {
      setImportedProposals(
        allImportedProposals.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.chainId.toLowerCase().includes(q)
        )
      );
    }
  }, [importedSearch, allImportedProposals]);

  const handleImport = async () => {
    if (!importId.trim()) {
      toast.error("Please enter a valid proposal ID to import");
      return;
    }
    setImporting(true);
    try {
      const response = await fetch("/api/proposals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chainId: importId }),
      });
      if (response.ok) {
        toast.success("Proposal imported successfully!");
        setImportDialogOpen(false);
        setImportId("");
        fetchProposals();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to import proposal.");
      }
    } catch {
      toast.error("An error occurred while importing the proposal.");
    } finally {
      setImporting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/proposals", {
        method: "GET",
      });
      if (res.ok) {
        toast.success("Proposals refreshed");
        router.refresh();
      }
    } catch (err) {
      console.error("Error refreshing proposals:", err);
      toast.error("Failed to refresh proposals");
    }
  };

  const handleMainSearch = async () => {
    if (!searchId.trim()) {
      toast.error("Please enter a valid proposal ID");
      return;
    }
    router.push(`/proposals/${searchId.trim()}`);
  };

  return (
    <RootLayout>
      <section className="container py-12 md:py-24">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-8 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              OpenGov AI Governance Bot
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
              GovBot helps evaluate and vote on Polkadot&apos;s OpenGov
              referenda with transparent, reasoned participation.
            </p>
            <div className="mx-auto max-w-[600px]">
              <div
                className="text-sm text-muted-foreground/80 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => setWalletNudgeOpen(true)}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🚀</span>
                  <strong>Ready to join the governance party?</strong>
                  <span className="text-lg">🎉</span>
                </div>
                <p className="mt-2 text-center">
                  Click here to connect your wallet and start chatting with
                  GovBot about proposals!
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="flex max-w-md w-full mx-auto gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Search proposal by ID..."
                  value={searchId}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setSearchId(val);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleMainSearch()}
                />
                <Button onClick={handleMainSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Dialog
                  open={importDialogOpen}
                  onOpenChange={setImportDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Import className="h-4 w-4 mr-2" />
                      Import Proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Proposal</DialogTitle>
                      <DialogDescription>
                        Enter a proposal ID from Polkassembly to import it into
                        GovBot. You can find proposal IDs at{" "}
                        <Link
                          href="https://polkadot.polkassembly.io"
                          className="underline hover:text-primary"
                          target="_blank"
                          rel="noopener"
                        >
                          Polkassembly
                        </Link>
                        .
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="importId">Proposal ID</Label>
                        <Input
                          id="importId"
                          placeholder="e.g. 42"
                          value={importId}
                          onChange={(e) => setImportId(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && !importing && handleImport()
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setImportDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleImport} disabled={importing}>
                        {importing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          "Import"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Link href="/about">
                  <Button variant="outline" className="gap-1">
                    <Bot className="h-4 w-4" />
                    About GovBot
                  </Button>
                </Link>

                <Button onClick={handleRefresh} className="gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Proposals
                </Button>
              </div>
            </div>
          </div>

          {/* Active Proposals Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Active Proposals
              </h2>
              <div className="w-1/3">
                <Input
                  placeholder="Search active proposals..."
                  value={activeSearch}
                  onChange={(e) => setActiveSearch(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeProposals.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-h-[54rem] overflow-y-auto">
                {activeProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-medium">
                  No active proposals
                </h3>
                <p className="text-sm text-muted-foreground">
                  Import a proposal to start chatting with GovBot
                </p>
              </div>
            )}
          </div>

          {/* Imported Proposals Section */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Imported Proposals
              </h2>
              <div className="w-1/3">
                <Input
                  placeholder="Search imported proposals..."
                  value={importedSearch}
                  onChange={(e) => setImportedSearch(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : importedProposals.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-h-[32rem] overflow-y-auto">
                {importedProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-medium">
                  No imported proposals
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use the &quot;Import Proposal&quot; button above to add
                  proposals for GovBot analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Wallet Nudge Dialog */}
      <WalletNudgeDialog
        open={walletNudgeOpen}
        onOpenChange={setWalletNudgeOpen}
        onAccountSelected={setSelectedAccount}
        selectedAccount={selectedAccount}
      />
    </RootLayout>
  );
}
