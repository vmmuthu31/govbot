import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import {
  ChatMessage,
  ProposalWithMessages,
  VoteDecision,
  VoteHistoryEntry,
} from "./../lib/types";
import {
  analyzeCost,
  analyzeVoteHistory,
  determineProposalType,
  determineVoteDecision,
  generateScoreBasedReasoning,
  scoreProposal,
  validateProposalTrack,
} from "@/utils/governance";
import prisma from "@/lib/db";
import { CHAT_LIMITS } from "@/lib/constants";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "qwen-qwq-32b";

const getSystemPrompt = (
  proposal: ProposalWithMessages,
  chatCount: number,
  voteHistory: VoteHistoryEntry[]
) => {
  const chatWarning =
    chatCount >= CHAT_LIMITS.WARNING_THRESHOLD
      ? `\n\n⚠️ IMPORTANT: This is chat ${chatCount} of ${
          CHAT_LIMITS.MAX_CHATS
        }. ${
          chatCount === CHAT_LIMITS.MAX_CHATS
            ? "This is your FINAL opportunity to discuss this proposal before I make my voting decision."
            : "We are approaching the chat limit."
        }`
      : `\n\nChat ${chatCount} of ${CHAT_LIMITS.MAX_CHATS} available.`;

  const historyInsight =
    voteHistory.length > 0
      ? `\n\n📊 MY VOTING HISTORY:\n${analyzeVoteHistory(voteHistory)}`
      : "\n\n📊 This will be my first vote in the system!";

  return `You are GovBot, an AI governance agent for Polkadot's OpenGov system.
You have delegated voting power and can vote on referenda. Your purpose is to evaluate proposals
and vote in the best interest of the Polkadot network using a systematic scoring approach.

CURRENT PROPOSAL:
Title: ${proposal.title}
ID: ${proposal.chainId}
Proposer: ${proposal.proposer}
Track: ${proposal.track || "Unknown"}
Description: ${proposal.description}

ABOUT POLKADOT GOVERNANCE:
Polkadot uses an OpenGov system with different tracks for proposals:
- Root (0): Highest permission level, can change core protocol features
- WhitelistedCaller (1): Permission to call privileged functions
- StakingAdmin (2): Controls staking parameters
- Treasurer (10): Controls spending of treasury funds
- FellowshipAdmin (12): Fellowship self-governance
- GeneralAdmin (13): For administrative matters
- SmallTipper (21), BigTipper (22): Treasury tips
- SmallSpender (30), MediumSpender (31), BigSpender (32): Treasury spending

MY EVALUATION CRITERIA (Weighted Scoring System):
1. Technical Feasibility (20%): Is the proposal technically sound and implementable?
2. Alignment with Goals (20%): Does it align with Polkadot's roadmap and values?
3. Economic Implications (15%): Cost-effectiveness and economic impact
4. Security Implications (15%): Security considerations and risk assessment
5. Community Sentiment (15%): Community engagement and support
6. Track Appropriateness (15%): Is the proposal on the correct governance track?

VOTING DECISION THRESHOLDS:
- AYE: ≥80% overall score (high confidence in proposal quality)
- ABSTAIN: 50-79% overall score (needs improvement or more discussion)
- NAY: <50% overall score (significant concerns that need addressing)

TRACK VALIDATION:
I will check if proposals are submitted to appropriate tracks:
- Treasury proposals → Treasurer, Spender, or Tipper tracks
- Staking changes → StakingAdmin track
- Protocol changes → Root track
- Administrative matters → GeneralAdmin track

As GovBot, I will:
1. Engage constructively and ask clarifying questions
2. Evaluate proposals systematically using my scoring criteria
3. Provide detailed feedback on areas for improvement
4. Be transparent about my evaluation process
5. Consider the proposal's impact on the broader Polkadot ecosystem
6. Learn from my voting history to maintain consistent standards

${chatWarning}${historyInsight}

IMPORTANT: Be concise and focused. Ask the most critical questions needed to properly evaluate this proposal. If the user's message is off-topic, politely redirect to the proposal discussion.`;
};

export async function generateChatResponse(
  proposal: ProposalWithMessages,
  messages: ChatMessage[]
): Promise<string> {
  try {
    const voteHistoryRaw = await prisma.voteHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const voteHistory: VoteHistoryEntry[] = voteHistoryRaw.map((v) => ({
      ...v,
      decision: v.decision as VoteDecision,
      track: v.track || undefined,
    }));

    if (proposal.chatCount >= CHAT_LIMITS.MAX_CHATS) {
      return "I've reached the maximum number of chats for this proposal. Please request my final voting decision using the vote button.";
    }

    const newChatCount = proposal.chatCount + 1;

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { chatCount: newChatCount },
    });

    if (newChatCount === 9) {
      const result = await generateText({
        model: groq(MODEL),
        providerOptions: {
          groq: { reasoningFormat: "parsed" },
        },
        system:
          getSystemPrompt(proposal, newChatCount, voteHistory) +
          `

🚨 CRITICAL: This is chat 9/10 - FINAL WARNING!
You have ONLY ONE CHAT LEFT before I must make my voting decision.

In your response, you MUST:
1. Clearly assess what information is still missing for a proper evaluation
2. Ask the most critical questions that will determine your vote
3. Guide the proposer to provide the essential details needed
4. Be direct about what could lead to Aye vs Nay vs Abstain

Make this response count - focus on the most important gaps in information!`,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      return (
        result.text +
        `

⚠️ **FINAL NOTICE**: This is your 9th chat out of 10. You have **ONE MORE CHANCE** to provide the critical information I need to vote favorably on your proposal. Please address my concerns thoroughly in your next message!`
      );
    }

    if (newChatCount === 10) {
      const evaluationResult = await generateText({
        model: groq(MODEL),
        providerOptions: {
          groq: { reasoningFormat: "parsed" },
        },
        system:
          getSystemPrompt(proposal, newChatCount, voteHistory) +
          `

🔥 FINAL CHAT (10/10) - DECISION TIME!

Based on ALL our conversations, you must now:
1. Evaluate if you have sufficient information to make a confident voting decision
2. If YES: Proceed with voting and explain your decision
3. If NO: Explain exactly what critical information is still missing

Be decisive and clear about whether this proposal meets the standards for voting.

Format your response as:
EVALUATION: [SUFFICIENT/INSUFFICIENT]
REASONING: [Detailed explanation]

If SUFFICIENT, also include:
VOTE_READY: YES
DECISION_PREVIEW: [Aye/Nay/Abstain with brief reasoning]

If INSUFFICIENT, include:
VOTE_READY: NO
MISSING_INFO: [List the critical missing information]`,
        messages: messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      });

      const evaluationText = evaluationResult.text;
      const isSufficient =
        evaluationText.includes("EVALUATION: SUFFICIENT") ||
        evaluationText.includes("VOTE_READY: YES");

      if (isSufficient) {
        return (
          evaluationText +
          `

✅ **EVALUATION COMPLETE**: I have sufficient information to proceed with voting. This concludes our discussion phase. 

🗳️ **Next Step**: Use the vote button to request my final decision, and I'll cast my vote on this proposal based on our comprehensive discussion.`
        );
      } else {
        return (
          evaluationText +
          `

❌ **EVALUATION INCOMPLETE**: Unfortunately, after 10 chats, I still don't have sufficient information to make a confident voting decision on this proposal.

🔍 **What this means**: I will likely **ABSTAIN** from voting due to insufficient information, unless you can address the missing points through the proposal description or external documentation.

💡 **Recommendation**: Consider updating your proposal with the missing information and resubmitting, or provide additional documentation that addresses my concerns.`
        );
      }
    }

    const result = await generateText({
      model: groq(MODEL),
      providerOptions: {
        groq: { reasoningFormat: "parsed" },
      },
      system: getSystemPrompt(proposal, newChatCount, voteHistory),
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return result.text;
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
}

export async function generateVoteDecision(
  proposal: ProposalWithMessages
): Promise<{ decision: VoteDecision; reasoning: string; score?: number }> {
  try {
    const voteHistoryRaw = await prisma.voteHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const voteHistory: VoteHistoryEntry[] = voteHistoryRaw.map((v) => ({
      ...v,
      decision: v.decision as VoteDecision,
      track: v.track || undefined,
    }));

    if (proposal.chatCount >= CHAT_LIMITS.MAX_CHATS) {
      const lastMessage = proposal.messages[proposal.messages.length - 1];
      if (
        lastMessage?.role === "assistant" &&
        (lastMessage.content.includes("EVALUATION INCOMPLETE") ||
          lastMessage.content.includes("VOTE_READY: NO") ||
          lastMessage.content.includes("MISSING_INFO:"))
      ) {
        const reasoning = `After 10 comprehensive chats with the proposer, I determined that insufficient information was provided to make a confident voting decision. Key concerns that remained unaddressed include technical feasibility details, implementation timeline, budget justification, and risk mitigation strategies. 

Due to the lack of critical information needed for proper evaluation, I am abstaining from this vote. I recommend the proposer address the missing information and consider resubmitting with more comprehensive documentation.`;

        await prisma.voteHistory.create({
          data: {
            proposalId: proposal.chainId,
            decision: "Abstain",
            score: 45,
            reasoning,
            track: proposal.track,
          },
        });

        return {
          decision: "Abstain",
          reasoning,
          score: 45,
        };
      }
    }

    const proposalType = determineProposalType(proposal);

    const trackValidation = validateProposalTrack(proposal, proposalType);

    const costAnalysis = analyzeCost(proposal);

    const score = scoreProposal(
      proposal,
      trackValidation,
      costAnalysis,
      voteHistory
    );

    const decision = determineVoteDecision(score);

    const reasoning = generateScoreBasedReasoning(
      score,
      trackValidation,
      costAnalysis,
      decision
    );

    await prisma.voteHistory.create({
      data: {
        proposalId: proposal.chainId,
        decision,
        score: score.overall,
        reasoning,
        track: proposal.track,
      },
    });

    return {
      decision,
      reasoning,
      score: score.overall,
    };
  } catch (error) {
    console.error("Error generating vote decision:", error);
    return {
      decision: "Abstain",
      reasoning:
        "Due to technical difficulties, I'm abstaining from voting on this proposal. Please try requesting my decision again later.",
    };
  }
}

export async function generateVoteDecisionLegacy(
  proposal: ProposalWithMessages
): Promise<{ decision: VoteDecision; reasoning: string }> {
  try {
    const messages = proposal.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const promptText = `
Based on our discussion about this proposal, I need to make a final voting decision.
Please analyze all the information we've discussed and decide whether to vote Aye, Nay, or Abstain.

When making your decision:
1. Consider the technical feasibility and soundness of the proposal
2. Assess alignment with Polkadot's goals and roadmap
3. Evaluate economic implications (costs, benefits)
4. Consider security implications
5. Take into account community sentiment and needs
6. Apply any track-specific considerations (e.g., Treasury proposals should show clear value)

Format your response as follows:

DECISION: [Aye/Nay/Abstain]
REASONING: [A detailed explanation of your reasoning, including all the factors you considered]
`;

    const result = await generateText({
      model: groq(MODEL),
      providerOptions: {
        groq: { reasoningFormat: "parsed" },
      },
      system: getSystemPrompt(proposal, proposal.chatCount, []),
      messages: [...messages, { role: "user", content: promptText }],
    });

    const response = result.text;
    const decisionMatch = response.match(/DECISION:\s*(Aye|Nay|Abstain)/i);
    const reasoningMatch = response.match(
      /REASONING:\s*([\s\S]*?)(?:$|DECISION)/i
    );

    const decision = (decisionMatch?.[1] as VoteDecision) || "Abstain";
    const reasoning =
      reasoningMatch?.[1]?.trim() ||
      "After careful consideration, I've decided to abstain as I don't have enough information to make a confident decision.";

    return { decision, reasoning };
  } catch (error) {
    console.error("Error generating vote decision:", error);
    return {
      decision: "Abstain",
      reasoning:
        "Due to technical difficulties, I'm abstaining from voting on this proposal. Please try requesting my decision again later.",
    };
  }
}
