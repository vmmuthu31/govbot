"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, ProposalWithMessages } from "@/lib/types";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage as ChatMessageComponent } from "../chat/ChatMessage";
import { formatDistanceToNow } from "@/utils/formatDistanceToNow";
import ReactMarkdown from "react-markdown";

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
  const [messages, setMessages] = useState<ChatMessage[]>(
    Array.isArray(initialMessages) ? initialMessages : []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | null>(
    null
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const checkProposalStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const response = await fetch(`/api/proposals/status?id=${proposal.id}`);
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
  };

  useEffect(() => {
    checkProposalStatus();
  }, [proposal.id]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isProposalLocked) return;

    try {
      setIsLoading(true);

      const userMessage: ChatMessage = {
        content: input,
        role: "user",
        createdAt: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, data.message]);

      if (data.vote && data.txHash) {
        toast.success(
          `Vote submitted to blockchain! TX Hash: ${data.txHash.slice(0, 8)}...`
        );
        console.log("Vote transaction:", {
          vote: data.vote,
          txHash: data.txHash,
        });
      }
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
      <div className="flex h-[600px] flex-col rounded-lg border bg-card text-card-foreground shadow">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-sm font-medium">Chat with GovBot</h3>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center max-w-full">
            {proposalStatus?.hasVote ? (
              <>
                <h4 className="text-lg font-medium">
                  Voted: {proposalStatus.vote?.decision}
                </h4>
                <div className="prose prose-sm dark:prose-invert max-h-[450px] my-5 overflow-y-auto text-left mx-auto">
                  <ReactMarkdown>
                    {(proposalStatus.vote?.reasoning ?? "").length > 2000
                      ? (proposalStatus.vote?.reasoning ?? "").slice(0, 2000) +
                        "\n\n*Reasoning truncated due to length*"
                      : proposalStatus.vote?.reasoning}
                  </ReactMarkdown>
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
    <div className="flex h-[600px] flex-col rounded-lg border bg-card text-card-foreground shadow">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium">Chat with GovBot</h3>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Bot className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                {isCheckingStatus
                  ? "Checking proposal status..."
                  : "Start the conversation by introducing your proposal to GovBot."}
              </p>
            </div>
          ) : (
            messages?.map((message, index) => (
              <ChatMessageComponent key={index} message={message} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="resize-none"
            rows={2}
            disabled={isLoading || isProposalLocked || isCheckingStatus}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={
              !input.trim() || isLoading || isProposalLocked || isCheckingStatus
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
  );
}
