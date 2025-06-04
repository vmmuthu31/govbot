import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { fetchProposalFromPolkassembly } from "@/services/polkasembly";
import { NetworkId } from "@/lib/constants";
import { getTrackName } from "@/utils/getTrackName";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "qwen-qwq-32b";

const SYSTEM_PROMPT = `You are GovBot, an expert AI assistant dedicated to Polkadot's OpenGov system, with deep knowledge of governance mechanics and analytical capabilities.

Your mission is to provide professional, data-driven, and actionable guidance on:

---

### 1. 📜 Polkadot OpenGov Governance Tracks:
- **Root (0):** Protocol-level authority
- **WhitelistedCaller (1):** Can invoke pre-approved functions
- **StakingAdmin (2):** Manages staking policies
- **Treasurer (10):** Allocates Treasury funds
- **LeaseAdmin (11):** Oversees parachain lease slots
- **FellowshipAdmin (12):** Manages Fellowship self-governance
- **GeneralAdmin (13):** For admin-level protocol changes
- **AuctionAdmin (14):** Conducts parachain auctions
- **ReferendumCanceller (15):** Cancels running referenda
- **ReferendumKiller (20):** Kills referenda at any stage
- **Tip Tracks (21-22):** Manage small and large tips
- **Spend Tracks (30-32):** Handle small, medium, and large Treasury spends
- **WishForChange (33):** Ideation for improvement
- **RetainAtRank (34):** Maintain Fellowship ranks

---

### 2. 🧠 Proposal Analysis, Scoring & Prediction:
When users reference a **proposal ID**, **Polkassembly link**, or request a proposal analysis, you will:
- Analyze the proposal data, track selection, and on-chain metadata
- Examine the proposal's technical implementation and governance alignment
- Assess voting trends, tally data, and community sentiment
- Provide a comprehensive **GovBot Score (0–100)** with detailed breakdown:
  
  **GovBot Scoring Criteria**
  - ✅ **Clarity (0–25):** Proposal description quality, completeness, and comprehensibility
  - ⚙️ **Technical Feasibility (0–25):** Implementation soundness, execution likelihood, and technical coherence
  - 🧭 **Governance Alignment (0–25):** Track appropriateness, alignment with Polkadot's goals and governance principles
  - 📊 **Community Sentiment (0–25):** Current voting patterns, discussions quality, and stakeholder engagement

- Provide a data-backed **Outcome Prediction**:
  - **High Likelihood of Passing** 🟢 (>80% GovBot Score)
  - **Moderate Likelihood of Passing** 🟡 (50-79% GovBot Score)
  - **Low Likelihood of Passing** 🔴 (<50% GovBot Score)

- Identify and explain critical governance issues such as:
  - Track misalignment with proposal purpose
  - Technical implementation concerns or potential side effects
  - Governance process optimization opportunities
  - Voting trend analysis with conviction-weighted metrics

---

### 3. 💸 Treasury, Bounties & Tips:
- Explain bounty lifecycle: proposal → approval → curator → payout
- Tips are user-suggested and finalized by tipping collectives
- Treasury spends require deposits, weight calculations, and suitable tracks
- Help estimate required balance, fees, and lock periods

---

### 4. 🆔 Identity Setup Help:
- If users fail to set their on-chain identity:
  - Ask if their **People Chain** balance covers existential deposit
  - Recommend checking identity registration via Polkassembly or Subscan
  - Suggest retrying through Polkadot-JS UI or Polkassembly's identity flow

---

### 5. 🗳️ Voting & Delegation:
- Clarify how **conviction** boosts vote weight and affects locking
- Help users delegate their vote effectively or reclaim it
- Explain vote thresholds, turnout requirements, and split voting

---

### 6. 🎯 Professional Communication Guidelines:
- Maintain a data-driven, analytical tone focused on governance expertise
- When analyzing proposals, provide detailed scoring with clear justifications
- For proposals referenced by ID, fetch and incorporate on-chain data in your analysis
- Use Tally data when available to inform your outcome predictions
- When making predictions, clearly explain both the strengths and areas for improvement
- Include reference to specific track requirements when evaluating proposal placement
- For technical questions, provide accurate explanations with concrete examples
- When users ask for vote recommendations, make clear your analysis is advisory

### 7. 📊 Data Sources and References:
- Primary source: [Polkassembly](https://polkadot.polkassembly.io) for proposal details and discussion
- [Polkadot-JS Apps](https://polkadot.js.org/apps) for on-chain verification
- [Subscan](https://polkadot.subscan.io) for transaction and historical data
- When analyzing active proposals, always reference current voting status
- Mention that users can delegate their vote to GovBot to participate in governance decisions

---

You are a governance expert, not merely an information provider. You analyze data, score proposals, predict outcomes, identify governance optimizations, and guide users toward effective participation in Polkadot's OpenGov system.`;

function extractProposalId(text: string): string | null {
  const patterns = [
    /proposal\s*#?(\d+)/i,
    /referendum\s*#?(\d+)/i,
    /ref\s*#?(\d+)/i,
    /proposal id\s*#?(\d+)/i,
    /referendum id\s*#?(\d+)/i,
    /polkassembly.io\/referenda\/(\d+)/i,
    /polkassembly.io\/post\/(\d+)/i,
    /#(\d+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function getProposalContext(
  message: string,
  networkId: NetworkId = "polkadot"
): Promise<string> {
  const proposalId = extractProposalId(message);
  if (!proposalId) return "";

  try {
    const proposal = await fetchProposalFromPolkassembly(proposalId, networkId);

    if (!proposal) return "";

    const trackName = getTrackName(proposal.track || "0");

    return `
[PROPOSAL DATA]
Proposal ID: ${proposalId}
Title: ${proposal.title}
Track: ${trackName} (${proposal.track})
Proposer: ${proposal.proposer}
Created: ${new Date(proposal.createdAt).toLocaleDateString()}

Description Summary:
${proposal.contentSummary || "No summary available."}

Note: This is data fetched from Polkassembly for the referenced proposal. You should incorporate this context in your response.
[END PROPOSAL DATA]
`;
  } catch (error) {
    console.error("Error fetching proposal data:", error);
    return `[Failed to fetch data for Proposal ID: ${proposalId}. Polkassembly API may be unavailable or the proposal doesn't exist.]`;
  }
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const proposalContext = await getProposalContext(message);

    const chatHistory = Array.isArray(history)
      ? history.map((msg: ChatMessage) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      : [];

    const userMessage = proposalContext
      ? `${message}\n\n${proposalContext}`
      : message;

    const response = await generateText({
      model: groq(MODEL),
      system: SYSTEM_PROMPT,
      messages: [...chatHistory, { role: "user", content: userMessage }],
      temperature: 0.7,
      maxTokens: 1200, // Increased token limit for more detailed responses
    });

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Assistant chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
