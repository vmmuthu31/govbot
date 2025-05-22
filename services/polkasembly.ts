import { InsertProposal, PolkassemblyResponse, Post } from "../lib/types";
import DOMPurify from "dompurify";

export async function fetchProposalFromPolkassembly(
  proposalId: string,
  retryCount = 3
): Promise<InsertProposal> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://polkadot.polkassembly.io/api/v1/posts/on-chain-post?postId=${proposalId}&proposalType=referendums_v2`,
        {
          headers: {
            "x-network": "polkadot",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch proposal: ${response.status} - ${response.statusText}`
        );
      }

      const data = (await response.json()) as PolkassemblyResponse;

      if (!data.title) {
        throw new Error("Missing required field: title");
      }

      let sanitizedContent = data.content || "No description available.";

      if (typeof window !== "undefined") {
        sanitizedContent = DOMPurify.sanitize(
          data.content || "No description available.",
          {
            ALLOWED_TAGS: [
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "p",
              "a",
              "ul",
              "ol",
              "li",
              "blockquote",
              "code",
              "pre",
              "strong",
              "em",
              "img",
              "br",
              "div",
              "span",
            ],
            ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target"],
          }
        );
      }

      return {
        chainId: proposalId,
        title: data.title,
        description: sanitizedContent,
        proposer: data.proposer || "Unknown",
        track: data.track,
        createdAt: data.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retryCount - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

export async function fetchActiveReferenda(
  retryCount = 3
): Promise<InsertProposal[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        "https://polkadot.polkassembly.io/api/v1/listing/on-chain-posts?page=1&limit=10&sortBy=newest&filterBy=referendums_v2",
        {
          headers: {
            "x-network": "polkadot",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch active referenda: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.posts || !Array.isArray(data.posts)) {
        throw new Error(
          "Invalid response format: missing or invalid posts array"
        );
      }

      const posts = data.posts || [];

      // Transform and validate each post
      return posts.map((post: Post) => {
        if (!post.post_id && !post.id) {
          throw new Error(
            `Invalid post data: missing id for post ${JSON.stringify(post)}`
          );
        }

        return {
          chainId: post.post_id || post.id,
          title: post.title || "Untitled Proposal",
          description: post.description || "No description available",
          proposer: post.proposer || "Unknown",
          track: post.track_name || post.track,
          createdAt: post.created_at || new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retryCount - 1) {
        // Wait before retrying, with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}
