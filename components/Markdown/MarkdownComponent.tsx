import type { Components } from "react-markdown";
import Link from "next/link";
import { ReactNode } from "react";

const ValidatorService = {
  isUrl: (url: string) => {
    return /^https?:\/\/.+/.test(url);
  },
  isValidEmail: (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
};

const extractUrlsAndEmails = (text: string): string[] => {
  const words = text.split(/\s+/);

  return words.filter((word) => {
    const cleanWord = word.replace(/[.,;:!?]$/, "");
    return (
      ValidatorService.isUrl(cleanWord) ||
      ValidatorService.isValidEmail(cleanWord)
    );
  });
};

const isVideoUrl = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".wmv"];
  const videoHostingPatterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^&\s]+)/,
    /vimeo\.com\/([^&\s]+)/,
    /dailymotion\.com\/video\/([^&\s]+)/,
    /facebook\.com\/watch\/\?v=([^&\s]+)/,
    /tiktok\.com\/@[^/]+\/video\/([^&\s]+)/,
  ];

  return (
    videoExtensions.some((ext) => url.toLowerCase().endsWith(ext)) ||
    videoHostingPatterns.some((pattern) => pattern.test(url))
  );
};

const getEmbedUrl = (url: string): string | null => {
  // YouTube
  if (url.includes("youtube.com/watch")) {
    const videoId = url.match(/v=([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }
  if (url.includes("youtu.be")) {
    const videoId = url.split("/").pop();
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  // Vimeo
  if (url.includes("vimeo.com")) {
    const videoId = url.split("/").pop();
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  // Dailymotion
  if (url.includes("dailymotion.com/video")) {
    const videoId = url.split("/").pop();
    return videoId
      ? `https://www.dailymotion.com/embed/video/${videoId}`
      : null;
  }

  // Facebook
  if (url.includes("facebook.com/watch")) {
    const videoId = url.match(/v=([^&\s]+)/)?.[1];
    return videoId
      ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
          url
        )}`
      : null;
  }

  // TikTok
  if (url.includes("tiktok.com")) {
    const videoId = url.split("/").pop();
    return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : null;
  }

  return null;
};

export const markdownComponents: Components = {
  div: "div",
  table: ({ children, ...props }) => (
    <table
      {...props}
      className="w-full border-collapse border border-border mb-4"
    >
      {children}
    </table>
  ),
  thead: ({ children, ...props }) => (
    <thead {...props} className="bg-muted">
      {children}
    </thead>
  ),
  tbody: "tbody",
  tr: ({ children, ...props }) => (
    <tr {...props} className="border-b border-border">
      {children}
    </tr>
  ),
  td: ({ children, ...props }) => (
    <td {...props} className="border border-border p-2 text-sm">
      {children}
    </td>
  ),
  th: ({ children, ...props }) => (
    <th
      {...props}
      className="border border-border p-2 text-sm font-semibold text-left"
    >
      {children}
    </th>
  ),
  ul: ({ children, ...props }) => (
    <ul {...props} className="list-disc pl-6 mb-4 mt-0 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} className="list-decimal pl-6 mb-4 mt-0 space-y-1">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li {...props} className="text-sm leading-relaxed text-foreground">
      {children}
    </li>
  ),
  code: ({ children, ...props }) => (
    <code {...props} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      {...props}
      className="bg-muted p-4 rounded-md overflow-auto mb-4 text-sm"
    >
      {children}
    </pre>
  ),
  img: ({ src, alt, height, width, ...props }) => {
    if (!src) {
      return null;
    }

    const embedUrl = getEmbedUrl(src);
    if (embedUrl) {
      return (
        <div className="video-container my-4">
          <iframe
            src={embedUrl}
            className="aspect-video h-auto w-full max-w-full"
            style={{
              width: "100%",
              height: "auto",
              maxWidth: "100%",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={alt || "Embedded video"}
          />
        </div>
      );
    }

    if (isVideoUrl(src)) {
      return (
        <div className="video-container my-4">
          <video
            controls
            className="h-auto w-full max-w-full"
            style={{
              width: "100%",
              height: "auto",
              maxWidth: "100%",
            }}
            aria-label={alt || "Video content"}
          >
            <source src={src} type={`video/${src.split(".").pop()}`} />
            <track kind="captions" src="" srcLang="en" label="English" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Handle regular images with proper sizing
    const imgHeight = height ? parseInt(height.toString()) : undefined;
    const imgWidth = width ? parseInt(width.toString()) : undefined;

    return (
      <div className="my-4 flex justify-center">
        <Link
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer"
        >
          <img
            src={src}
            alt={alt || "Image"}
            height={imgHeight}
            width={imgWidth}
            className="max-w-full h-auto rounded border border-border"
            style={{
              maxWidth: "100%",
              height: "auto",
              ...(imgWidth && { width: Math.min(imgWidth, 800) }),
              ...(imgHeight && { maxHeight: Math.min(imgHeight, 600) }),
            }}
            {...props}
          />
        </Link>
      </div>
    );
  },
  a: ({ href, children, ...props }) => {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline transition-colors duration-200"
        style={{ color: "#E5007A" }}
        {...props}
      >
        {children}
      </a>
    );
  },
  p: ({ children, ...props }) => {
    if (typeof children === "string") {
      const textContent = children;
      const matches = extractUrlsAndEmails(textContent);

      if (matches.length === 0) {
        return (
          <p
            {...props}
            className="mb-4 text-sm leading-relaxed text-foreground"
          >
            {children}
          </p>
        );
      }

      let remaining = textContent;
      const elements: ReactNode[] = [];
      let index = 0;

      matches.forEach((match) => {
        const position = remaining.indexOf(match);
        if (position !== -1) {
          if (position > 0) {
            elements.push(
              <span key={`text-${index}`}>
                {remaining.substring(0, position)}
              </span>
            );
            index += 1;
          }

          if (ValidatorService.isUrl(match)) {
            elements.push(
              <a
                key={`link-${index}`}
                href={match}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "#E5007A" }}
              >
                {match}
              </a>
            );
          } else if (ValidatorService.isValidEmail(match)) {
            elements.push(
              <a
                key={`email-${index}`}
                href={`mailto:${match}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "#E5007A" }}
              >
                {match}
              </a>
            );
          } else {
            elements.push(<span key={`text-${index}`}>{match}</span>);
          }

          index += 1;

          remaining = remaining.substring(position + match.length);
        }
      });

      if (remaining) {
        elements.push(<span key={`text-${index}`}>{remaining}</span>);
      }

      return (
        <p {...props} className="mb-4 text-sm leading-relaxed text-foreground">
          {elements}
        </p>
      );
    }

    return (
      <p {...props} className="mb-4 text-sm leading-relaxed text-foreground">
        {children}
      </p>
    );
  },
  h1: ({ children, ...props }) => (
    <h1
      {...props}
      className="text-3xl font-bold mb-4 mt-6 pb-2 border-b border-border text-foreground"
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      {...props}
      className="text-2xl font-bold mb-4 mt-6 pb-2 border-b border-border text-foreground"
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 {...props} className="text-xl font-bold mb-3 mt-5 text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 {...props} className="text-lg font-bold mb-3 mt-4 text-foreground">
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 {...props} className="text-base font-bold mb-2 mt-4 text-foreground">
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 {...props} className="text-sm font-bold mb-2 mt-3 text-foreground">
      {children}
    </h6>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      {...props}
      className="border-l-4 border-border pl-4 italic text-muted-foreground mb-4"
    >
      {children}
    </blockquote>
  ),
  hr: ({ ...props }) => (
    <hr {...props} className="my-6 border-0 h-px bg-border" />
  ),
  strong: ({ children, ...props }) => (
    <strong {...props} className="font-bold text-foreground">
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em {...props} className="italic text-foreground">
      {children}
    </em>
  ),
  del: ({ children, ...props }) => (
    <del {...props} className="line-through text-muted-foreground">
      {children}
    </del>
  ),
  s: ({ children, ...props }) => (
    <s {...props} className="line-through text-muted-foreground">
      {children}
    </s>
  ),
  sup: ({ children, ...props }) => (
    <sup {...props} className="text-xs align-super">
      {children}
    </sup>
  ),
  sub: ({ children, ...props }) => (
    <sub {...props} className="text-xs align-sub">
      {children}
    </sub>
  ),
  mark: ({ children, ...props }) => (
    <mark {...props} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
      {children}
    </mark>
  ),
  br: ({ ...props }) => <br {...props} />,
  span: ({ children, ...props }) => (
    <span {...props} className="text-foreground">
      {children}
    </span>
  ),
  link: "a",
  data: "data",
};
