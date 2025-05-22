"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProposalCard } from "@/components/proposal/ProposalCard";
import type { ProposalWithMessages } from "@/lib/types";
import Link from "next/link";
import { Bot, RefreshCw, Search, Import, Cpu } from "lucide-react";
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

export default function Home() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [importId, setImportId] = useState("");
  const [importing, setImporting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch("/api/proposals");
        if (response.ok) {
          const data = await response.json();
          setProposals(data.proposals || []);
        }
      } catch (err) {
        console.error("Error fetching proposals:", err);
        toast.error("Failed to load proposals. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      toast.error("Please enter a valid proposal ID");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/proposals/${searchId}`);
      if (response.ok) {
        const data = await response.json();
        router.push(`/proposals/${data.proposal.chainId}`);
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.error ||
            "Proposal not found. Please check the ID and try again."
        );
      }
    } catch (err) {
      console.error("Error searching for proposal:", err);
      toast.error("Failed to search for proposal. Please try again later.");
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async () => {
    if (!importId.trim()) {
      toast.error("Please enter a valid proposal ID to import");
      return;
    }

    setImporting(true);
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: importId }),
      });

      if (response.ok) {
        toast.success("Proposal imported successfully!");
        setImportDialogOpen(false);
        setImportId("");
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.error ||
            "Failed to import proposal. Please check the ID and try again."
        );
      }
    } catch (err) {
      console.error("Error importing proposal:", err);
      toast.error(
        "An error occurred while importing the proposal. Please try again later."
      );
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

            <div className="flex flex-col items-center gap-6">
              <div className="flex max-w-md w-full mx-auto gap-2">
                <Input
                  placeholder="Search proposal by ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !searching && handleSearch()
                  }
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">
                {loading
                  ? "Loading..."
                  : proposals.length > 0
                  ? "Active Proposals"
                  : "No Active Proposals"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Total: {proposals.length} proposal(s)
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : proposals.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {proposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-medium">No proposals yet</h3>
                <p className="mb-4 max-w-md text-center text-sm text-muted-foreground">
                  There are no active proposals in the database. Click one of
                  the buttons above to fetch proposals from Polkassembly or
                  directly from the blockchain.
                </p>
                <div className="flex gap-2">
                  <form action="/api/proposals" method="POST">
                    <Button type="submit" className="gap-1">
                      <RefreshCw className="h-4 w-4" />
                      Fetch from Polkassembly
                    </Button>
                  </form>
                  <form action="/api/polkadot/proposals" method="POST">
                    <Button type="submit" variant="secondary" className="gap-1">
                      <Cpu className="h-4 w-4" />
                      Fetch On-Chain
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </RootLayout>
  );
}
