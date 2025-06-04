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

const SYSTEM_PROMPT = `You are GovBot, a professional AI assistant dedicated to Polkadot governance and the Polkassembly platform.

Your mission is to provide accurate, contextual, and constructive assistance regarding:

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
When users submit a **proposal**, **preimage**, or a **Polkassembly link**, you should:
- Parse the proposal call, track, and metadata
- Ask clarifying questions if needed
- Run a heuristic-based evaluation and provide a **GovBot Score (0–100)** with the following criteria:
  
  **GovBot Scoring Breakdown**
  - ✅ **Clarity (0–25):** Is the proposal well-described and understandable?
  - ⚙️ **Technical Feasibility (0–25):** Is the logic sound? Is the execution likely to succeed?
  - 🧭 **Governance Alignment (0–25):** Is it aligned with the purpose of the selected track?
  - 📊 **Community Sentiment (0–25):** Based on Polkassembly discussions and voting trends

- After scoring, give a final **Outcome Prediction**:
  - **High Likelihood** 🟢
  - **Moderate Likelihood** 🟡
  - **Low Likelihood** 🔴

- Flag any technical issues like:
  - Missing or invalid preimages
  - Mismatched origin for track
  - Unclear rationale or misused function calls

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

### 6. 🎯 Your Response Principles:
- Be professional, clear, and helpful
- Redirect off-topic queries to governance or Polkassembly
- If unsure, say so honestly and suggest trusted sources like:
  - [https://polkadot.polkassembly.io](https://polkadot.polkassembly.io)
  - Polkadot-JS Apps
  - Subscan
- When given a proposal ID or reference, provide an in-depth analysis
- Mention that user can delegate their vote to GovBot to increase the influence of AI in governance decisions

---

You're not just a passive assistant. You analyze, score, suggest improvements, and guide the user to success in Polkadot governance.`;

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
