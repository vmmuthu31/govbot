import { InsertProposal, PolkassemblyResponse, Post } from "../lib/types";
import DOMPurify from "dompurify";

export async function fetchProposalFromPolkassembly(
  proposalId: string
): Promise<InsertProposal> {
  try {
    const response = await fetch(
      `https://polkadot.polkassembly.io/api/v1/posts/on-chain-post?postId=${proposalId}&proposalType=referendums_v2`,
      {
        headers: {
          "x-network": "polkadot",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch proposal: ${response.statusText}`);
    }

    const data = (await response.json()) as PolkassemblyResponse;

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
    console.error("Error fetching proposal from Polkassembly:", error);
    throw error;
  }
}

export async function fetchActiveReferenda(): Promise<InsertProposal[]> {
  try {
    const response = await fetch(
      "https://polkadot.polkassembly.io/api/v1/listing/on-chain-posts?page=1&limit=10&sortBy=newest&filterBy=referendums_v2",
      {
        headers: {
          "x-network": "polkadot",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch active referenda: ${response.statusText}`
      );
    }

    const data = await response.json();
    const posts = data.posts || [];

    return posts.map((post: Post) => ({
      chainId: post.post_id || post.id,
      title: post.title || "Untitled Proposal",
      description: post.description || "No description available",
      proposer: post.proposer || "Unknown",
      track: post.track_name || post.track,
      createdAt: post.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching active referenda:", error);
    throw error;
  }
}
