"use client";

import { Bot, User } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/utils/formatDistanceToNow";
import { MarkdownViewer } from "../Markdown/MarkdownViewer";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 max-w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-primary" />
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm overflow-hidden",
          isUser
            ? "rounded-tr-none bg-primary text-primary-foreground"
            : "rounded-tl-none bg-muted text-muted-foreground"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-full break-words overflow-hidden">
          {message.content.includes("\n") || message.content.includes("**") ? (
            <div className="prose prose-sm dark:prose-invert max-w-full overflow-hidden">
              <MarkdownViewer
                markdown={message.content}
                className="max-w-full overflow-hidden break-words"
              />
            </div>
          ) : (
            <div className="break-words overflow-wrap-anywhere">
              {message.content}
            </div>
          )}
        </div>
        <div className="mt-1 text-right text-xs opacity-70">
          {message.createdAt && formatDistanceToNow(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
