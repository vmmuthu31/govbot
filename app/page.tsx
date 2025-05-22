import { RootLayout } from "@/components/layout/RootLayout";
import { ProposalCard } from "@/components/proposal/ProposalCard";
import prisma from "@/lib/db";
import Link from "next/link";
import { Bot, RefreshCw, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Proposal = Awaited<ReturnType<typeof prisma.proposal.findFirst>>;

export default async function Home() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: { vote: true },
  });

  return (
    <RootLayout>
      <section className="container py-12 md:py-24">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              OpenGov AI Governance Bot
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
              GovBot helps evaluate and vote on Polkadot&apos;s OpenGov
              referenda with transparent, reasoned participation.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/about">
                <Button variant="outline" className="gap-1">
                  <Bot className="h-4 w-4" />
                  Learn About GovBot
                </Button>
              </Link>
              <form action="/api/proposals" method="POST">
                <Button type="submit" className="gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Refresh from Polkassembly
                </Button>
              </form>
              <form action="/api/polkadot/proposals" method="POST">
                <Button type="submit" variant="secondary" className="gap-1">
                  <Cpu className="h-4 w-4" />
                  Fetch On-Chain Proposals
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">
                {proposals.length > 0
                  ? "Active Proposals"
                  : "No Active Proposals"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Total: {proposals.length} proposal(s)
              </p>
            </div>

            {proposals.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {proposals.map((proposal: Proposal) => (
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
