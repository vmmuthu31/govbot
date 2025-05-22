import { RootLayout } from "@/components/layout/root-layout";
import Link from "next/link";
import { Bot, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <RootLayout>
      <section className="container py-12 md:py-24">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              About GovBot
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
              An AI-powered governance agent integrated with Polkadot&apos;s
              OpenGov interface.
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Overview</h2>
              <p className="text-muted-foreground">
                GovBot is an AI-powered governance agent integrated with
                Polkassembly&apos;s OpenGov interface. It holds delegated voting
                power and interacts with proposal authors and the broader
                Polkadot community via a contextual chat interface.
              </p>
              <p className="text-muted-foreground">
                Users can attempt to convince the bot to vote Aye, Nay, or
                Abstain on an OpenGov referendum by providing reasoning,
                context, and discussion. Once convinced, GovBot votes and
                publicly posts a decision summary explaining its rationale.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Goals</h2>
              <ul className="ml-6 space-y-2 list-disc text-muted-foreground">
                <li>
                  Enable transparent and reasoned participation of an AI agent
                  in Polkadot OpenGov.
                </li>
                <li>
                  Make proposal voting more interactive, merit-based, and
                  explainable.
                </li>
                <li>
                  Set a foundation for AI-driven, community-trainable governance
                  delegates.
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Key Features</h2>

              <div className="space-y-2">
                <h3 className="text-xl font-medium">
                  1. GovBot Identity & Voting Power
                </h3>
                <ul className="ml-6 space-y-1 list-disc text-muted-foreground">
                  <li>
                    Unique on-chain identity with verified Polkassembly profile.
                  </li>
                  <li>Receives delegated voting power from DOT holders.</li>
                  <li>Votes on OpenGov Referenda across different Tracks.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-medium">
                  2. Chat Interface Embedded in Referenda
                </h3>
                <ul className="ml-6 space-y-1 list-disc text-muted-foreground">
                  <li>
                    Chat UI on each referendum page for users to engage with
                    GovBot.
                  </li>
                  <li>
                    Proposal metadata + summary context fetched from
                    Polkassembly.
                  </li>
                  <li>Context-aware chat history tied to each referendum.</li>
                  <li>
                    Inline references to track rules (e.g., origin, decision
                    period).
                  </li>
                  <li>
                    &quot;Request Decision&quot; trigger to start evaluation
                    phase.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-medium">3. AI Decision Engine</h3>
                <ul className="ml-6 space-y-1 list-disc text-muted-foreground">
                  <li>
                    Considers proposal text & metadata, Polkassembly discussion
                    threads, arguments presented in chat.
                  </li>
                  <li>
                    Evaluates track origin, threshold, and decision period.
                  </li>
                  <li>
                    Uses AI models with prompt + vector search to assess
                    relevance, feasibility, alignment with network goals.
                  </li>
                  <li>
                    Once confident, the bot posts its vote and decision summary.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-medium">
                  4. Vote Execution + Comment Summary
                </h3>
                <ul className="ml-6 space-y-1 list-disc text-muted-foreground">
                  <li>
                    Casts vote using OpenGov delegation (Direct Vote from GovBot
                    account).
                  </li>
                  <li>
                    Leaves a public comment on the Polkassembly referendum with
                    decision summary and justification.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-medium">Get Started</h3>
              <p className="mb-4 text-muted-foreground">
                Explore active proposals and interact with GovBot to help make
                governance decisions on the Polkadot network.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/">
                  <Button className="gap-1">
                    <Bot className="h-4 w-4" />
                    View Proposals
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://polkadot.network/features/governance/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-1">
                    Learn About OpenGov
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </RootLayout>
  );
}
