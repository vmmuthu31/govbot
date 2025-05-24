interface ValidationResult {
  canVote: boolean;
  reason?: string;
}

export function validateVoteReadiness(
  messages: Array<{ role: string; content: string }>
): ValidationResult {
  if (messages.length < 4) {
    return {
      canVote: false,
      reason:
        "More discussion is needed before making a voting decision. Please explain your proposal and address any questions.",
    };
  }

  const userMessages = messages.filter((m) => m.role === "user");
  const messageContent = userMessages
    .map((m) => m.content.toLowerCase())
    .join(" ");

  const hasExplainedPurpose =
    messageContent.includes("purpose") ||
    messageContent.includes("goal") ||
    messageContent.includes("objective");

  const hasExplainedImpact =
    messageContent.includes("impact") ||
    messageContent.includes("effect") ||
    messageContent.includes("result");

  const hasAddressedConcerns =
    messageContent.includes("concern") ||
    messageContent.includes("risk") ||
    messageContent.includes("challenge");

  if (!hasExplainedPurpose) {
    return {
      canVote: false,
      reason: "Please explain the purpose or goal of your proposal.",
    };
  }

  if (!hasExplainedImpact) {
    return {
      canVote: false,
      reason: "Please explain the expected impact or effects of your proposal.",
    };
  }

  if (!hasAddressedConcerns) {
    return {
      canVote: false,
      reason:
        "Please address any potential concerns or risks associated with your proposal.",
    };
  }

  return { canVote: true };
}
