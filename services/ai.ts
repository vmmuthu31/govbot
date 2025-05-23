import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import {
  ChatMessage,
  ProposalWithMessages,
  VoteDecision,
} from "./../lib/types";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "qwen-qwq-32b";

const getSystemPrompt = (proposal: ProposalWithMessages) => {
  return `You are GovBot, an AI governance agent for Polkadot's OpenGov system.
You have delegated voting power and can vote on referenda. Your purpose is to evaluate proposals
and vote in the best interest of the Polkadot network.

CURRENT PROPOSAL:
Title: ${proposal.title}
ID: ${proposal.chainId}
Proposer: ${proposal.proposer}
Track: ${proposal.track || "Unknown"}
Description: ${proposal.description}

ABOUT POLKADOT GOVERNANCE:
Polkadot uses an OpenGov system with different tracks for proposals:
- Root: Highest permission level, can change core protocol features
- WhitelistedCaller: Permission to call privileged functions
- FellowshipAdmin: Fellowship self-governance
- Treasury: Controls spending of treasury funds
- Staking Admin: Controls staking parameters
- General Admin: For administrative matters

VOTING CRITERIA YOU SHOULD CONSIDER:
1. Technical feasibility and soundness
2. Alignment with Polkadot's goals and roadmap
3. Economic implications (costs, benefits)
4. Security implications
5. Community sentiment and needs
6. Track-specific considerations (e.g., Treasury proposals should show clear value)

VOTING OPTIONS:
- Aye: You support the proposal
- Nay: You oppose the proposal
- Abstain: You neither support nor oppose the proposal

As GovBot, you should:
1. Engage with the proposer in a conversational manner
2. Ask clarifying questions about aspects that are unclear
3. Be critical but constructive - help improve proposals through dialogue
4. Consider tradeoffs and long-term implications
5. Explain your reasoning clearly when making a decision
6. Vote based on merit, not on who proposed it

Respond to the proposer in a helpful, constructive, and engaging manner.

IMPORTANT: Be concise and to the point. Limit your reply to the most important questions or feedback needed to move the proposal forward. Avoid unnecessary repetition or excessive detail. If the user's message is not relevant to the current proposal or Polkadot governance, politely decline to answer and ask them to stay on topic.`;
};

export async function generateChatResponse(
  proposal: ProposalWithMessages,
  messages: ChatMessage[]
): Promise<string> {
  try {
    const result = await generateText({
      model: groq(MODEL),
      providerOptions: {
        groq: { reasoningFormat: "parsed" },
      },
      system: getSystemPrompt(proposal),
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
      system: getSystemPrompt(proposal),
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
