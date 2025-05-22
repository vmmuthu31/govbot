import { RootLayout } from "@/components/layout/RootLayout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <RootLayout>
      <section className="container py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link
            href="/"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to home
          </Link>

          <div>
            <h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <p>Last updated: May 22, 2025</p>

              <h2>Acceptance of Terms</h2>
              <p>
                By accessing or using GovBot, you agree to be bound by these
                Terms of Service and all applicable laws and regulations. If you
                do not agree with any of these terms, you are prohibited from
                using this service.
              </p>

              <h2>Description of Service</h2>
              <p>
                GovBot is an AI-powered governance agent integrated with
                Polkadot&apos;s OpenGov interface. It holds delegated voting
                power and interacts with proposal authors and the broader
                Polkadot community via a contextual chat interface.
              </p>

              <h2>User Conduct</h2>
              <p>When using GovBot, you agree to:</p>
              <ul>
                <li>
                  Provide accurate and truthful information about proposals
                </li>
                <li>
                  Not attempt to manipulate GovBot for unfair advantage or to
                  harm the Polkadot ecosystem
                </li>
                <li>Not use the service for any illegal purposes</li>
                <li>
                  Not attempt to interfere with the proper functioning of GovBot
                </li>
              </ul>

              <h2>No Guarantee of Specific Outcomes</h2>
              <p>
                GovBot makes decisions based on its AI programming and the
                information provided to it. We do not guarantee any specific
                voting outcomes. GovBot will vote based on its assessment of
                what is best for the Polkadot ecosystem.
              </p>

              <h2>Public Nature of Interactions</h2>
              <p>
                Please be aware that interactions with GovBot related to
                governance proposals may be public. Voting decisions and
                reasoning will be posted publicly on Polkassembly.
              </p>

              <h2>Intellectual Property</h2>
              <p>
                GovBot and its original content, features, and functionality are
                owned by the service providers and are protected by
                international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </p>

              <h2>Limitation of Liability</h2>
              <p>
                We shall not be liable for any indirect, incidental, special,
                consequential or punitive damages resulting from your use or
                inability to use the service. This includes any losses resulting
                from governance decisions made by GovBot.
              </p>

              <h2>Changes to Terms</h2>
              <p>
                We may revise these terms of service at any time without notice.
                By using GovBot, you are agreeing to be bound by the current
                version of these terms of service.
              </p>

              <h2>Governing Law</h2>
              <p>
                These terms shall be governed and construed in accordance with
                the laws applicable to the service providers, without regard to
                its conflict of law provisions.
              </p>

              <h2>Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us
                at [contact email/information].
              </p>
            </div>
          </div>
        </div>
      </section>
    </RootLayout>
  );
}
