"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  ChevronUp,
  ChevronDown,
  Info,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { FaUserAlt } from "react-icons/fa";
import { MarkdownViewer } from "@/components/Markdown/MarkdownViewer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

const CHAT_STORAGE_KEY = "govbot-chat-history";

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
    try {
      const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        const messagesWithDates = parsedMessages.map(
          (msg: {
            id: string;
            content: string;
            role: "user" | "assistant";
            timestamp: string;
          }) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })
        );
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error("Failed to load chat history from local storage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history to local storage", error);
    }
  }, [messages]);

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

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleClearAllMessages = () => {
    setMessages([
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
        let processedContent = "";

        if (typeof data.message === "object" && data.message.text) {
          processedContent = data.message.text.replace(
            /<think>[\s\S]*?<\/think>/g,
            ""
          );
        } else if (typeof data.message === "string") {
          try {
            if (
              data.message.trim().startsWith("{") &&
              data.message.trim().endsWith("}")
            ) {
              const parsedObj = JSON.parse(data.message);
              if (parsedObj.text) {
                processedContent = parsedObj.text;
              } else if (parsedObj.message && parsedObj.message.text) {
                processedContent = parsedObj.message.text;
              } else {
                processedContent = data.message;
              }
            } else {
              processedContent = data.message;
            }
          } catch {
            console.log("Failed to parse message JSON, using raw content");
            processedContent = data.message;
          }
        } else {
          processedContent = JSON.stringify(data.message);
        }

        processedContent = processedContent.replace(
          /<think>[\s\S]*?<\/think>/g,
          ""
        );

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-response",
            content: processedContent,
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

  const [showInitialTooltip, setShowInitialTooltip] = useState(true);

  useEffect(() => {
    if (showInitialTooltip) {
      const timer = setTimeout(() => {
        setShowInitialTooltip(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showInitialTooltip]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat toggle button */}
      {!isOpen && (
        <TooltipProvider>
          <Tooltip open={showInitialTooltip}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  setIsOpen(true);
                  setShowInitialTooltip(false);
                }}
                className="h-14 w-14 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center relative"
                aria-label="Open governance assistant"
              >
                <Bot className="h-6 w-6" />
                {/* Pulsing ring animation */}
                <span className="absolute w-full h-full rounded-full bg-primary/30 animate-ping"></span>
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse"></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-center">
                Chat with GovBot about Polkadot governance!
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="bg-background border rounded-lg shadow-lg w-80 sm:w-96 flex flex-col overflow-hidden transition-all duration-200 max-h-[600px]">
          {/* Chat header */}
          <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-primary-foreground">
                <Bot className="h-7 w-7 pl-1 text-primary transition-transform group-hover:scale-110" />
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">GovBot Assistant</h3>
                <p className="text-xs text-primary-foreground/80">
                  Polkadot Governance Expert
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {messages.length > 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-primary-foreground/20 p-1"
                        onClick={handleClearAllMessages}
                        aria-label="Clear chat history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear chat history</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
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
                      "flex gap-2 animate-fadeIn group relative",
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
                        {msg.role === "user" ? (
                          <FaUserAlt />
                        ) : (
                          <Bot className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
                        )}
                      </AvatarFallback>
                      {msg.role === "assistant" && (
                        <Bot className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
                      )}
                    </Avatar>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm max-w-[75%] relative",
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : "bg-muted"
                      )}
                    >
                      {msg.id !== "welcome" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs rounded-full p-0.5 hover:bg-red-100 dark:hover:bg-red-900"
                                aria-label="Delete message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete message</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <div
                        className={cn(
                          "chat-message-content",
                          msg.role === "user" ? "text-white" : ""
                        )}
                      >
                        <MarkdownViewer
                          markdown={msg.content}
                          className={msg.role === "user" ? "text-white" : ""}
                        />
                      </div>
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
