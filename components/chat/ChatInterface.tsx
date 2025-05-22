"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, ProposalWithMessages } from "@/lib/types";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage as ChatMessageComponent } from "../chat/ChatMessage";

interface ChatInterfaceProps {
  proposal: ProposalWithMessages;
  initialMessages: ChatMessage[];
  onRequestVote: () => Promise<void>;
}

export function ChatInterface({
  proposal,
  initialMessages,
  onRequestVote,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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

  const handleRequestVote = async () => {
    if (isVoting) return;

    try {
      setIsVoting(true);
      await onRequestVote();
      toast.success("Vote request successful");
    } catch (error) {
      console.error("Error requesting vote:", error);
      toast.error("Failed to request a vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-lg border bg-card text-card-foreground shadow">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium">Chat with GovBot</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRequestVote}
          disabled={isVoting || messages.length < 2 || Boolean(proposal.vote)}
        >
          {isVoting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Requesting Vote...
            </>
          ) : proposal.vote ? (
            `Voted: ${proposal.vote.decision}`
          ) : (
            "Request Vote"
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Bot className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                Start the conversation by introducing your proposal to GovBot.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
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
            disabled={isLoading || Boolean(proposal.vote)}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || Boolean(proposal.vote)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {proposal.vote && (
          <p className="mt-2 text-xs text-muted-foreground">
            This proposal has been voted on. The conversation is now closed.
          </p>
        )}
      </div>
    </div>
  );
}
