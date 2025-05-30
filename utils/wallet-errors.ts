export const handleWalletError = (error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes("timed out") || errorMessage.includes("Timeout")) {
    return "Wallet connection timed out. Please check if your wallet extension is unlocked and try again.";
  }

  if (
    errorMessage.includes("not authorized") ||
    errorMessage.includes("Not authorized") ||
    errorMessage.includes("request rejected") ||
    errorMessage.includes("Request rejected")
  ) {
    return "Connection request was denied. Please approve the connection request in your wallet extension.";
  }

  if (
    errorMessage.includes("wallet not found") ||
    errorMessage.includes("not found")
  ) {
    return "Selected wallet extension was not found. Please make sure it's properly installed and enabled.";
  }

  if (errorMessage.includes("No accounts")) {
    return "No accounts found in your wallet. Please create or import an account first.";
  }

  if (errorMessage.includes("Signer not available")) {
    return "Signature request failed. Your wallet may not support message signing or the request was denied.";
  }

  if (errorMessage.includes("Unable to decode signature")) {
    return "Invalid signature format. Please try again with a different account.";
  }

  if (errorMessage.includes("Cancelled")) {
    return "Action was cancelled by the user. Please try again when ready.";
  }

  return errorMessage;
};
