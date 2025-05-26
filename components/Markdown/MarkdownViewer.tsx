"use client";

import { useState, useRef, useLayoutEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { FiArrowDownCircle } from "react-icons/fi";
import { FiArrowUpCircle } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { markdownComponents } from "./MarkdownComponent";

interface ReactMarkdownProps {
  markdown: string;
  className?: string;
  truncate?: boolean;
  maxLines?: number;
  onShowMore?: () => void;
}

export function MarkdownViewer(props: ReactMarkdownProps) {
  const {
    markdown,
    className,
    truncate = false,
    maxLines = 4,
    onShowMore,
  } = props;
  const [showMore, setShowMore] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = editorRef.current;

    const handleResize = () => {
      if (!truncate || !element) return;
      const { scrollHeight, offsetHeight } = element;

      if (offsetHeight && scrollHeight && offsetHeight < scrollHeight) {
        setIsTruncated(true);
      } else {
        setIsTruncated(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (editorRef.current) {
      resizeObserver.observe(editorRef.current);
    }

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (element) {
        resizeObserver.unobserve(element);
      }
    };
  }, [truncate]);

  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore();
      return;
    }
    setShowMore(true);
  };

  const handleShowLess = () => {
    setShowMore(false);
  };

  return (
    <div className="w-full">
      <div
        ref={editorRef}
        className={cn(
          "markdown-body",
          truncate && !showMore ? `line-clamp-${maxLines}` : "line-clamp-none",
          "w-full",
          className
        )}
      >
        <ReactMarkdown
          components={markdownComponents}
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw]}
        >
          {markdown}
        </ReactMarkdown>
      </div>
      {truncate &&
        (showMore ? (
          <div className="flex justify-center pt-2">
            <span
              onClick={handleShowLess}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-background px-3 py-1.5 text-sm font-medium text-foreground"
              aria-hidden="true"
            >
              Show Less <FiArrowUpCircle className="text-lg" />
            </span>
          </div>
        ) : isTruncated ? (
          <div className="flex justify-center pt-2">
            <span
              onClick={handleShowMore}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-background px-3 py-1.5 text-sm font-medium text-foreground"
              aria-hidden="true"
            >
              Show More <FiArrowDownCircle className="text-lg" />
            </span>
          </div>
        ) : null)}
    </div>
  );
}
