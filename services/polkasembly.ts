import {
  InsertProposal,
  PolkassemblyResponse,
  ACTIVE_PROPOSAL_STATUSES,
} from "../lib/types";
import { NETWORKS, NetworkId } from "../lib/constants";

interface PolkassemblyV2Item {
  index?: number;
  id?: string;
  title?: string;
  content?: string;
  proposer?: string;
  track_name?: string;
  track?: string;
  created_at?: string;
  onChainInfo?: {
    proposer?: string;
    origin?: string;
    createdAt?: string;
  };
}

export async function fetchProposalFromPolkassembly(
  proposalId: string,
  networkId: NetworkId = "polkadot",
  retryCount = 3
): Promise<InsertProposal> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const networkConfig = NETWORKS[networkId];
      const response = await fetch(
        `${networkConfig.polkassemblyUrl}/api/v2/ReferendumV2/${proposalId}`,
        {
          headers: {
            "x-network": networkConfig.name,
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

      return {
        chainId: proposalId,
        title: data.title,
        description: data.content || "No description available",
        proposer: data.proposer || "Unknown",
        track: data.track,
        createdAt: data.created_at || new Date().toISOString(),
        contentSummary: data?.contentSummary?.postSummary || "",
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
  networkId: NetworkId = "polkadot",
  retryCount = 3
): Promise<InsertProposal[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const networkConfig = NETWORKS[networkId];

      const statusParams = ACTIVE_PROPOSAL_STATUSES.map(
        (status) => `status=${status}`
      ).join("&");
      const response = await fetch(
        `${networkConfig.polkassemblyUrl}/api/v2/ReferendumV2?page=1&limit=50&${statusParams}`,
        {
          headers: {
            "x-network": networkConfig.name,
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

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error(
          "Invalid response format: missing or invalid items array"
        );
      }

      const posts = data.items || [];

      return posts.map((post: PolkassemblyV2Item) => {
        if (!post.index && !post.id) {
          throw new Error(
            `Invalid post data: missing id for post ${JSON.stringify(post)}`
          );
        }

        console.log("post data:", post);

        return {
          chainId: String(post.index || post.id),
          title: post.title || "Untitled Proposal",
          description: post.content || "No description available",
          proposer: post.onChainInfo?.proposer || post.proposer || "Unknown",
          track: post.onChainInfo?.origin || post.track_name || post.track,
          createdAt:
            post.onChainInfo?.createdAt ||
            post.created_at ||
            new Date().toISOString(),
        };
      });
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
