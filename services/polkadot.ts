import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import type { RefCountedProposal } from "@/lib/types";
import { RPC_ENDPOINTS } from "@/lib/constants";
import type { AccountInfo } from "@polkadot/types/interfaces";

interface VotingData {
  delegations?: {
    votes?: string;
  };
}

class PolkadotService {
  private static instance: PolkadotService;
  private api: ApiPromise | null = null;
  private currentRpcIndex: number = 0;

  private constructor() {}

  static getInstance(): PolkadotService {
    if (!PolkadotService.instance) {
      PolkadotService.instance = new PolkadotService();
    }
    return PolkadotService.instance;
  }

  /**
   * Initialize the Polkadot API connection with failover support
   */
  async initApi(): Promise<ApiPromise> {
    if (this.api?.isConnected) {
      return this.api;
    }

    for (let attempt = 0; attempt < RPC_ENDPOINTS.length; attempt++) {
      try {
        const endpoint =
          process.env.POLKADOT_RPC_URL ||
          RPC_ENDPOINTS[this.currentRpcIndex].url;
        const provider = new WsProvider(endpoint);

        this.api = await ApiPromise.create({ provider });
        await this.api.isReady;

        console.log(`Connected to Polkadot RPC: ${endpoint}`);

        this.api.on("disconnected", async () => {
          console.log(
            "Disconnected from Polkadot RPC, attempting to reconnect..."
          );
          await this.switchRpcEndpoint();
        });

        return this.api;
      } catch (error) {
        console.error(
          `Failed to connect to RPC ${
            RPC_ENDPOINTS[this.currentRpcIndex].url
          }:`,
          error
        );
        await this.switchRpcEndpoint();
      }
    }

    throw new Error("Failed to connect to any Polkadot RPC endpoint");
  }

  /**
   * Switch to the next available RPC endpoint
   */
  private async switchRpcEndpoint(): Promise<void> {
    if (this.api) {
      try {
        await this.api.disconnect();
      } catch (error) {
        console.error("Error disconnecting from current RPC:", error);
      }
    }

    this.currentRpcIndex = (this.currentRpcIndex + 1) % RPC_ENDPOINTS.length;
    this.api = null;
  }

  async getGovBotWallet() {
    try {
      await cryptoWaitReady();
      const keyring = new Keyring({ type: "sr25519" });

      if (process.env.POLKADOT_WALLET_JSON) {
        const walletJson = process.env.POLKADOT_WALLET_JSON;
        const walletData =
          typeof walletJson === "string" && walletJson.startsWith("{")
            ? JSON.parse(walletJson)
            : { encoded: walletJson };

        return keyring.addFromJson(walletData);
      }

      const address = process.env.POLKADOT_BOT_ADDRESS;
      if (!address) {
        throw new Error("POLKADOT_BOT_ADDRESS is not set");
      }

      return keyring.addFromAddress(address);
    } catch (error) {
      console.error("Error loading GovBot wallet:", error);
      throw new Error(
        "Failed to load GovBot wallet: " + (error as Error).message
      );
    }
  }

  async fetchOnChainProposals(): Promise<RefCountedProposal[]> {
    try {
      const api = await this.initApi();

      const referendaEntries =
        await api.query.referenda.referendumInfoFor.entries();
      const proposals: RefCountedProposal[] = [];

      for (const [key, optInfo] of referendaEntries) {
        const refId = key.args[0].toString();
        const info = optInfo.toJSON() as {
          ongoing?: {
            proposal: unknown;
            track: string | number;
            submissionDeposit: { who: string };
            submitted: string | number;
            decisionDeposit?: unknown;
            tally: { ayes: string | number; nays: string | number };
          };
        };

        if (!info?.ongoing) {
          continue;
        }

        const ongoingInfo = info.ongoing;
        const { proposal, track, submissionDeposit, submitted, tally } =
          ongoingInfo;

        proposals.push({
          id: refId,
          track: String(track),
          submitted: String(submitted),
          submitter: submissionDeposit.who,
          proposal: JSON.stringify(proposal),
          decisionDepositPlaced: !!ongoingInfo.decisionDeposit,
          tally: {
            ayes: String(tally.ayes),
            nays: String(tally.nays),
          },
        });
      }

      return proposals;
    } catch (error) {
      console.error("Error fetching on-chain proposals:", error);
      throw new Error(
        "Failed to fetch on-chain proposals: " + (error as Error).message
      );
    }
  }

  async getGovBotVotingPower(): Promise<string> {
    try {
      const api = await this.initApi();
      const botAddress = process.env.POLKADOT_BOT_ADDRESS;

      if (!botAddress) {
        throw new Error("POLKADOT_BOT_ADDRESS is not set");
      }

      const accountInfo = (await api.query.system.account(
        botAddress
      )) as AccountInfo;
      const free = accountInfo.data.free.toString();
      const dotAmount = Number(free) / 10_000_000_000;

      const delegations = await api.query.convictionVoting.votingFor.entries(
        botAddress
      );

      let delegatedAmount = 0;
      for (const [, voting] of delegations) {
        const votingData = voting.toJSON() as VotingData[];
        if (Array.isArray(votingData)) {
          for (const vote of votingData) {
            if (vote?.delegations?.votes) {
              delegatedAmount += Number(vote.delegations.votes);
            }
          }
        }
      }

      const delegatedDot = delegatedAmount / 10_000_000_000;
      const totalPower = dotAmount + delegatedDot;

      return totalPower.toString();
    } catch (error) {
      console.error("Error getting GovBot voting power:", error);
      throw new Error(
        "Failed to get GovBot voting power: " + (error as Error).message
      );
    }
  }

  async submitVote(
    referendumId: string,
    vote: "aye" | "nay" | "abstain",
    conviction: number = 1
  ): Promise<string> {
    try {
      const api = await this.initApi();
      await cryptoWaitReady();

      await this.getGovBotWallet();

      const voteType = vote.toLowerCase();

      let voteValue;
      if (voteType === "aye") {
        voteValue = { Standard: { vote: { aye: true }, conviction } };
      } else if (voteType === "nay") {
        voteValue = { Standard: { vote: { aye: false }, conviction } };
      } else {
        voteValue = { Abstain: null };
      }

      const tx = api.tx.convictionVoting.vote(referendumId, voteValue);
      return u8aToHex(tx.method.toU8a());
    } catch (error) {
      console.error("Error submitting vote:", error);
      throw new Error("Failed to submit vote: " + (error as Error).message);
    }
  }
}

export const polkadotService = PolkadotService.getInstance();
