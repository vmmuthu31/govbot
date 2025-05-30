"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  Loader2,
  AlertCircle,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, ProposalWithMessages } from "@/lib/types";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage as ChatMessageComponent } from "../chat/ChatMessage";
import { formatDistanceToNow } from "@/utils/formatDistanceToNow";
import dynamic from "next/dynamic";
const WalletConnect = dynamic(
  () => import("../wallet/WalletConnect").then((mod) => mod.WalletConnect),
  {
    ssr: false,
  }
);
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MarkdownViewer } from "../Markdown/MarkdownViewer";
import { WalletNudgeDialog } from "../wallet/WalletNudgeDialog";
import { useNetwork } from "@/lib/network-context";
import { isSameAccount } from "@/utils/address";

interface ChatInterfaceProps {
  proposal: ProposalWithMessages;
  initialMessages: ChatMessage[];
}

interface ProposalStatus {
  hasVote: boolean;
  isActive: boolean;
  vote: {
    decision: string;
    reasoning: string;
    votedAt: Date;
  } | null;
}

type WalletAccount = {
  address: string;
  name?: string;
  source: string;
  type?: string;
  genesisHash?: string;
};

interface ChatInterfaceProps {
  proposal: ProposalWithMessages;
  initialMessages: ChatMessage[];
}

interface ProposalStatus {
  hasVote: boolean;
  isActive: boolean;
  vote: {
    decision: string;
    reasoning: string;
    votedAt: Date;
  } | null;
}

export function ChatInterface({
  proposal,
  initialMessages,
}: ChatInterfaceProps) {
  const { networkConfig } = useNetwork();
  const [messages, setMessages] = useState<ChatMessage[]>(
    Array.isArray(initialMessages) ? initialMessages : []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | null>(
    null
  );
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(
    null
  );
  const [walletError, setWalletError] = useState<string | null>(null);
  const [proposerValidationError, setProposerValidationError] = useState<{
    error: string;
    proposer: string;
    connectedAddress: string;
  } | null>(null);
  const [walletNudgeOpen, setWalletNudgeOpen] = useState(false);
  const [currentChatCount, setCurrentChatCount] = useState(
    proposal.chatCount || 0
  );
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const checkProposalStatus = useCallback(async () => {
    try {
      setIsCheckingStatus(true);
      const response = await fetch(
        `/api/proposals/status?chainId=${proposal.id}&network=${proposal.network}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch proposal status");
      }
      const status = await response.json();
      setProposalStatus(status);
    } catch (error) {
      console.error("Error checking proposal status:", error);
      toast.error("Failed to check proposal status");
    } finally {
      setIsCheckingStatus(false);
    }
  }, [proposal.chainId, proposal.network]);

  useEffect(() => {
    const loadGlobalWallet = async () => {
      try {
        setIsLoadingWallet(true);
        const { walletService } = await import("@/services/wallet");
        const wallet = await walletService.verifyAndRefreshConnection();

        if (wallet) {
          const persistedAccountAddress = localStorage.getItem(
            "selectedAccountAddress"
          );
          if (persistedAccountAddress) {
            const account = wallet.accounts.find(
              (acc) => acc.address === persistedAccountAddress
            );
            if (account) {
              setSelectedAccount(account);
            } else if (wallet.accounts.length > 0) {
              setSelectedAccount(wallet.accounts[0]);
            }
          } else if (wallet.accounts.length > 0) {
            setSelectedAccount(wallet.accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error loading global wallet state:", error);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    loadGlobalWallet();
  }, []);

  useEffect(() => {
    checkProposalStatus();
  }, [checkProposalStatus]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isProposalLocked) return;

    if (!selectedAccount) {
      setWalletError("Please connect your wallet to chat with the bot.");
      toast.error("Please connect your wallet to chat with the bot.");
      return;
    }

    setWalletError(null);
    setProposerValidationError(null);

    try {
      setIsLoading(true);

      const userMessage: ChatMessage = {
        content: input,
        role: "user",
        createdAt: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");

      const response = await fetch(`/api/chat?network=${networkConfig.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalId: proposal.chainId,
          message: userMessage.content,
          userAddress: selectedAccount.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 403) {
          setProposerValidationError({
            error: errorData.error,
            proposer: errorData.proposer,
            connectedAddress: errorData.connectedAddress,
          });
          toast.error("Only the proposer can chat with this proposal");
          return;
        }

        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, data.message]);

      if (data.vote && data.txHash) {
        toast.success(
          `Vote submitted to blockchain! TX Hash: ${data.txHash.slice(0, 8)}...`
        );
      }

      setCurrentChatCount((prevCount) => prevCount + 1);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isProposalLocked = proposalStatus?.hasVote || !proposalStatus?.isActive;

  const getStatusMessage = () => {
    if (isCheckingStatus) return "Checking proposal status...";
    if (!proposalStatus?.isActive) return "This proposal is no longer active.";
    if (proposalStatus?.hasVote)
      return `Voted: ${proposalStatus.vote?.decision}`;
    return null;
  };

  if (
    !isCheckingStatus &&
    (proposalStatus?.hasVote || !proposalStatus?.isActive)
  ) {
    return (
      <div className="flex h-[500px] flex-col rounded-lg border bg-card text-card-foreground shadow w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between border-b px-2 sm:px-4 py-2">
          <div className="flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-sm font-medium">Chat with GovBot</h3>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-2 sm:p-4">
          <div className="text-center max-w-full">
            {proposalStatus?.hasVote ? (
              <>
                <h4 className="text-lg font-medium">
                  Voted: {proposalStatus.vote?.decision}
                </h4>
                <div className="prose prose-sm dark:prose-invert max-h-[300px]  my-3 sm:my-5 overflow-y-auto text-left mx-auto">
                  <MarkdownViewer
                    markdown={proposalStatus.vote?.reasoning ?? ""}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Voted{" "}
                  {formatDistanceToNow(
                    new Date(proposalStatus.vote?.votedAt || "")
                  )}{" "}
                  ago
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                This proposal is no longer active
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[500px] flex-col rounded-lg border bg-card text-card-foreground shadow w-full max-w-full overflow-hidden">
      {/* Account Status Bar */}
      <div className="flex items-center justify-between border-b px-2 sm:px-4 py-2">
        <div className="flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium">Chat with GovBot</h3>
          <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
            ({currentChatCount}/10 chats)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedAccount && (
            <div className="flex items-center gap-2">
              {isSameAccount(selectedAccount.address, proposal.proposer) ? (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="hidden sm:inline">Proposer</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Wrong Account</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          selectedAccount &&
          !isSameAccount(selectedAccount.address, proposal.proposer)
            ? "filter blur-[2px]"
            : ""
        }`}
      >
        <ScrollArea className="flex-1 p-2 sm:p-4 overflow-hidden max-h-[500px] ">
          {messages?.length === 0 ? (
            <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
              <div className="flex flex-col items-center">
                <Bot className="mb-2 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground">
                  {isCheckingStatus
                    ? "Checking proposal status..."
                    : "Start the conversation by introducing your proposal to GovBot."}
                </p>
              </div>
              {!selectedAccount && (
                <Button
                  variant="outline"
                  onClick={() => setWalletNudgeOpen(true)}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Connect Wallet to Chat
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-full">
              {/* Proposer Validation Error */}
              {proposerValidationError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Access Restricted</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{proposerValidationError.error}</p>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium text-foreground">
                          Required Proposer Address:
                        </p>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {proposerValidationError.proposer.slice(0, 6)}...
                          {proposerValidationError.proposer.slice(-6)}
                        </code>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium text-foreground">
                          Currently Connected:
                        </p>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {proposerValidationError.connectedAddress.slice(0, 6)}
                          ...
                          {proposerValidationError.connectedAddress.slice(-6)}
                        </code>
                      </div>
                    </div>
                    <div className="pt-2">
                      <WalletConnect
                        onAccountSelected={(account) => {
                          setSelectedAccount(account);
                          if (
                            account &&
                            isSameAccount(
                              account.address,
                              proposerValidationError.proposer
                            )
                          ) {
                            setProposerValidationError(null);
                          }
                        }}
                        selectedAccount={selectedAccount}
                      />
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Wallet Connection Error */}
              {walletError && !proposerValidationError && (
                <Alert variant="destructive" className="mb-4">
                  <Wallet className="h-4 w-4" />
                  <AlertTitle>Wallet Required</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{walletError}</p>
                    <WalletConnect
                      onAccountSelected={(account) => {
                        setSelectedAccount(account);
                        setWalletError(null);
                      }}
                      selectedAccount={selectedAccount}
                    />
                  </AlertDescription>
                </Alert>
              )}

              {messages?.map((message, index) => (
                <ChatMessageComponent key={index} message={message} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Chat Input */}
        <div className="border-t p-2 sm:p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !selectedAccount
                  ? "Connect your wallet to start chatting..."
                  : !isSameAccount(selectedAccount.address, proposal.proposer)
                  ? "Only the proposer can chat with this proposal..."
                  : "Type your message..."
              }
              className="resize-none text-sm"
              rows={1}
              disabled={
                isLoading ||
                isProposalLocked ||
                isCheckingStatus ||
                !selectedAccount ||
                !isSameAccount(selectedAccount.address, proposal.proposer)
              }
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={
                !input.trim() ||
                isLoading ||
                isProposalLocked ||
                isCheckingStatus ||
                !selectedAccount ||
                !isSameAccount(selectedAccount.address, proposal.proposer)
              }
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {(isCheckingStatus || isProposalLocked) && (
            <p className="mt-2 text-xs text-muted-foreground">
              {getStatusMessage()}
            </p>
          )}
        </div>
      </div>

      {!selectedAccount ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-4 sm:p-6 space-y-4">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center">
                {isLoadingWallet ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <Wallet className="h-8 w-8 text-primary" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {isLoadingWallet
                    ? "🔍 Checking Wallet Connection..."
                    : "🚀 Ready to Join the Conversation?"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isLoadingWallet
                    ? "Looking for existing wallet connections..."
                    : "Connect your wallet to start chatting with GovBot about this proposal!"}
                </p>
              </div>

              <Button
                onClick={() => setWalletNudgeOpen(true)}
                disabled={isLoadingWallet}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
              >
                {isLoadingWallet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Connect Wallet to Chat
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {!isLoadingWallet && (
                <p className="text-xs text-muted-foreground">
                  Experience our fun wallet connection flow! ✨
                </p>
              )}
            </div>
          </div>
        </div>
      ) : !isSameAccount(selectedAccount.address, proposal.proposer) ? (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-4 sm:p-6 space-y-4">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  🔐 Oops! Wrong Account Detected
                </h3>
                <p className="text-sm text-muted-foreground">
                  Only the proposer can chat with this proposal. Let&apos;s get
                  you connected with the right account!
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Required:
                  </span>
                  <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs">
                    {proposal.proposer.slice(0, 8)}...
                    {proposal.proposer.slice(-8)}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    Connected:
                  </span>
                  <code className="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded text-xs">
                    {selectedAccount.address.slice(0, 8)}...
                    {selectedAccount.address.slice(-8)}
                  </code>
                </div>
              </div>

              <Button
                onClick={() => setWalletNudgeOpen(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Switch to Proposer Account
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-muted-foreground">
                Click above for a fun wallet switching experience! 🎯
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Wallet Nudge Dialog */}
      <WalletNudgeDialog
        open={walletNudgeOpen}
        onOpenChange={setWalletNudgeOpen}
        onAccountSelected={(account) => {
          setSelectedAccount(account);
          setWalletError(null);
        }}
        selectedAccount={selectedAccount}
        title={
          selectedAccount &&
          !isSameAccount(selectedAccount.address, proposal.proposer)
            ? "🔄 Switch to Proposer Account"
            : "🎯 Ready to Chat with GovBot?"
        }
        description={
          selectedAccount &&
          !isSameAccount(selectedAccount.address, proposal.proposer)
            ? `Connect the proposer account (${proposal.proposer.slice(
                0,
                8
              )}...${proposal.proposer.slice(
                -8
              )}) to start chatting about this proposal with GovBot!`
            : "Connect your wallet to start discussing this proposal with our AI governance assistant. Your insights matter!"
        }
      />
    </div>
  );
}
