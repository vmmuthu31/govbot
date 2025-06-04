"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, ChevronUp, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

export function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm GovBot, your Polkadot governance assistant. I can help you with:\n\n" +
        "• Analyzing proposals and referenda\n" +
        "• Scoring proposals based on technical feasibility, governance alignment and more\n" +
        "• Explaining OpenGov tracks and voting mechanisms\n" +
        "• Providing information on delegation and treasury proposals\n\n" +
        "Reference specific proposals by ID (e.g., 'Analyze referendum #1588' or 'Should I vote for proposal 1573?') to get detailed insights.",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [polkadotExample, setPolkadotExample] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeProposalIds, setActiveProposalIds] = useState<string[]>([
    "1588",
    "1584",
    "1573",
    "1579",
  ]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const fetchActiveProposals = async () => {
      try {
        const response = await fetch("/api/proposals/active?network=polkadot");
        if (response.ok) {
          const data = await response.json();
          if (
            data.activeProposals &&
            Array.isArray(data.activeProposals) &&
            data.activeProposals.length > 0
          ) {
            const randomIds =
              data.activeProposals.length > 4
                ? [...data.activeProposals]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 4)
                : data.activeProposals;
            setActiveProposalIds(randomIds);
          }
        }
      } catch (error) {
        console.warn("Could not fetch active proposals for examples", error);
      }
    };

    fetchActiveProposals();
  }, []);

  const baseExamples = [
    "What are OpenGov tracks?",
    "How do I delegate my votes?",
    "Explain conviction voting",
  ];

  const examples = [
    ...baseExamples,
    `Analyze referendum #${activeProposalIds[0] || "1588"}`,
    `Score proposal ${activeProposalIds[1] || "1584"}`,
    `Should I vote for referendum #${activeProposalIds[2] || "1573"}?`,
    "Tell me about the latest Treasury proposals",
    `What's the status of proposal ${activeProposalIds[3] || "1579"}?`,
  ];

  useEffect(() => {
    setPolkadotExample(examples[Math.floor(Math.random() * examples.length)]);
  }, [examples]);

  const handleExampleClick = (example: string) => {
    setMessage(example);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-response",
            content: data.message,
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-error",
          content: "Sorry, I couldn't process your request. Please try again.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const withLinks = content.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
    );

    const withBold = withLinks.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    const withItalic = withBold.replace(/\*(.*?)\*/g, "<em>$1</em>");

    const withBreaks = withItalic.replace(/\n/g, "<br />");

    return withBreaks;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat toggle button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          aria-label="Open governance assistant"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="bg-background border rounded-lg shadow-lg w-80 sm:w-96 flex flex-col overflow-hidden transition-all duration-200 max-h-[600px]">
          {/* Chat header */}
          <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-primary-foreground">
                <AvatarFallback>GB</AvatarFallback>
                <AvatarImage src="/bot-avatar.png" alt="GovBot" />
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">GovBot Assistant</h3>
                <p className="text-xs text-primary-foreground/80">
                  Polkadot Governance Expert
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-primary-foreground/20 p-1"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                {isMinimized ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-primary-foreground/20 p-1"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-80">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2 animate-fadeIn",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar
                      className={cn(
                        "h-8 w-8",
                        msg.role === "user" ? "bg-secondary" : "bg-primary"
                      )}
                    >
                      <AvatarFallback>
                        {msg.role === "user" ? "U" : "G"}
                      </AvatarFallback>
                      {msg.role === "assistant" && (
                        <AvatarImage src="/bot-avatar.png" alt="GovBot" />
                      )}
                    </Avatar>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm max-w-[75%]",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(msg.content),
                        }}
                        className="chat-message-content"
                      />
                      <div className="text-xs opacity-50 mt-1">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 animate-pulse">
                    <Avatar className="h-8 w-8 bg-primary">
                      <AvatarFallback>G</AvatarFallback>
                      <AvatarImage src="/bot-avatar.png" alt="GovBot" />
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <div className="h-4 w-20 bg-muted-foreground/20 rounded animate-pulse"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion chips */}
              {messages.length === 1 && (
                <div className="px-3 py-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    <span>Try asking about:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {examples.slice(0, 3).map((example) => (
                      <button
                        key={example}
                        onClick={() => handleExampleClick(example)}
                        className="px-2 py-1 bg-secondary/50 hover:bg-secondary text-xs rounded-full text-secondary-foreground transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="border-t p-3 flex gap-2">
                <Input
                  placeholder={
                    polkadotExample ||
                    "Ask about proposals, voting, or governance..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  ref={inputRef}
                  className="flex-1"
                  aria-label="Type your message"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                  aria-label="Send message"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
