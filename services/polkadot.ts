/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import type { RefCountedProposal } from "@/lib/types";
import { RPC_ENDPOINTS } from "@/lib/constants";
import type { AccountInfo } from "@polkadot/types/interfaces";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { EventRecord } from "@polkadot/types/interfaces";
import type { WalletAccount } from "@/services/wallet";

export enum EVoteDecision {
  AYE = "aye",
  NAY = "nay",
  SPLIT = "split",
  SPLIT_ABSTAIN = "splitAbstain",
  ABSTAIN = "abstain",
}

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

        this.api.on("disconnected", async () => {
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
    await cryptoWaitReady();
    const keyring = new Keyring({ type: "sr25519" });

    if (process.env.POLKADOT_SEED_PHRASE) {
      const pair = keyring.addFromUri(process.env.POLKADOT_SEED_PHRASE);
      return pair;
    }

    let walletData;
    if (process.env.POLKADOT_WALLET_JSON) {
      const walletJson = process.env.POLKADOT_WALLET_JSON;
      if (typeof walletJson === "string" && walletJson.startsWith("{")) {
        walletData = JSON.parse(walletJson);
      } else {
        const fs = await import("fs");
        const path = await import("path");
        const walletPath = path.resolve(process.cwd(), walletJson);
        const walletFile = fs.readFileSync(walletPath, "utf8");
        walletData = JSON.parse(walletFile);
      }
    } else {
      throw new Error(
        "POLKADOT_WALLET_JSON or POLKADOT_SEED_PHRASE is not set"
      );
    }

    if (
      walletData.encoding &&
      walletData.encoding.content &&
      walletData.encoding.content.includes("batch-pkcs8")
    ) {
      throw new Error(
        "Batch wallets are not supported for signing. Please export individual account JSON or use POLKADOT_SEED_PHRASE environment variable instead."
      );
    } else if (
      walletData.accounts &&
      Array.isArray(walletData.accounts) &&
      walletData.accounts.length > 0
    ) {
      const accountData = walletData.accounts[0];
      const pair = keyring.addFromJson(accountData);

      if (process.env.POLKADOT_WALLET_PASSWORD) {
        pair.decodePkcs8(process.env.POLKADOT_WALLET_PASSWORD);
      }

      return pair;
    } else {
      const pair = keyring.addFromJson(walletData);

      if (process.env.POLKADOT_WALLET_PASSWORD) {
        pair.decodePkcs8(process.env.POLKADOT_WALLET_PASSWORD);
      }

      return pair;
    }
  }

  /**
   * Get the GovBot address from environment variables
   */
  getGovBotAddress(): string {
    if (!process.env.POLKADOT_BOT_ADDRESS) {
      throw new Error(
        "POLKADOT_BOT_ADDRESS is not set in environment variables"
      );
    }
    return process.env.POLKADOT_BOT_ADDRESS;
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
            decisionDeposit?: {
              who: string;
              amount: string | number;
            };
            tally: { ayes: string | number; nays: string | number };
          };
        };

        if (!info?.ongoing) {
          continue;
        }

        const ongoingInfo = info.ongoing;
        const {
          proposal,
          track,
          submissionDeposit,
          submitted,
          decisionDeposit,
          tally,
        } = ongoingInfo;

        const blockTimestamp = await this.getBlockTimestamp(submitted);

        proposals.push({
          id: refId,
          track: String(track),
          submitted: String(submitted),
          submitter: submissionDeposit.who,
          proposal: JSON.stringify(proposal),
          decisionDepositPlaced: !!decisionDeposit,
          decisionDeposit: decisionDeposit
            ? {
                who: decisionDeposit.who,
                amount: String(decisionDeposit.amount),
              }
            : undefined,
          tally: {
            ayes: String(tally.ayes),
            nays: String(tally.nays),
          },
          createdAt: blockTimestamp,
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

  /**
   * Fetch a single on-chain proposal by its referendum ID
   */
  async fetchProposalById(
    referendumId: string
  ): Promise<RefCountedProposal | null> {
    try {
      const api = await this.initApi();
      const optInfo = await api.query.referenda.referendumInfoFor(referendumId);
      const info = optInfo.toJSON() as {
        ongoing?: {
          proposal: unknown;
          track: string | number;
          submissionDeposit: { who: string };
          submitted: string | number;
          decisionDeposit?: {
            who: string;
            amount: string | number;
          };
          tally: { ayes: string | number; nays: string | number };
        };
      };

      if (!info?.ongoing) {
        return null;
      }

      const ongoingInfo = info.ongoing;
      const {
        proposal,
        track,
        submissionDeposit,
        submitted,
        decisionDeposit,
        tally,
      } = ongoingInfo;

      let title: string | undefined;
      let description: string | undefined;

      try {
        const { fetchProposalFromPolkassembly } = await import(
          "@/services/polkasembly"
        );
        const polkassemblyData = await fetchProposalFromPolkassembly(
          referendumId
        );
        title = polkassemblyData.title;
        description = polkassemblyData.description;
      } catch (polkassemblyError) {
        console.warn("Failed to fetch from Polkassembly:", polkassemblyError);
      }

      const blockTimestamp = await this.getBlockTimestamp(submitted);

      return {
        id: referendumId,
        track: String(track),
        submitted: String(submitted),
        submitter: submissionDeposit.who,
        proposal: JSON.stringify(proposal),
        decisionDepositPlaced: !!decisionDeposit,
        decisionDeposit: decisionDeposit
          ? {
              who: decisionDeposit.who,
              amount: String(decisionDeposit.amount),
            }
          : undefined,
        tally: {
          ayes: String(tally.ayes),
          nays: String(tally.nays),
        },
        title,
        description,
        createdAt: blockTimestamp,
      };
    } catch (error) {
      console.error("Error fetching proposal by id:", error);
      throw new Error(
        "Failed to fetch proposal by id: " + (error as Error).message
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

  /**
   * Check if a proposal is currently active based on its referendum ID
   * @param referendumId The ID of the proposal to check
   * @returns Promise<boolean> True if the proposal is active, false otherwise
   */
  async isProposalActive(referendumId: string): Promise<boolean> {
    try {
      const api = await this.initApi();
      const optInfo = await api.query.referenda.referendumInfoFor(referendumId);
      const info = optInfo.toJSON() as {
        ongoing?: {
          proposal: unknown;
          track: string | number;
          submissionDeposit: { who: string };
          decisionDeposit?: {
            who: string;
            amount: string | number;
          };
        };
        approved?: boolean;
        rejected?: boolean;
        cancelled?: boolean;
        timedOut?: boolean;
        killed?: boolean;
      };

      return (
        !!info?.ongoing &&
        !info.approved &&
        !info.rejected &&
        !info.cancelled &&
        !info.timedOut &&
        !info.killed
      );
    } catch (error) {
      console.error("Error checking proposal status:", error);
      throw new Error(
        "Failed to check proposal status: " + (error as Error).message
      );
    }
  }

  async getVotingPower(address: string): Promise<string> {
    try {
      const api = await this.initApi();
      const accountInfo = (await api.query.system.account(
        address
      )) as AccountInfo;
      const free = accountInfo.data.free.toString();
      const dotAmount = Number(free) / 10_000_000_000;
      return dotAmount.toString();
    } catch (error) {
      console.error("Error getting voting power:", error);
      throw new Error(
        "Failed to get voting power: " + (error as Error).message
      );
    }
  }

  /**
   * Delegate voting power using browser wallet (for frontend use)
   * @param delegateAddress Address to delegate to
   * @param amount Amount in DOT to delegate
   * @param conviction Conviction multiplier (1-6)
   * @param tracks Array of tracks to delegate (default: [0])
   * @param userAddress User's wallet address for signing
   * @param onSuccess Callback for successful transaction
   * @param onFailed Callback for failed transaction
   */
  async delegateVotingPower({
    delegateAddress,
    amount,
    conviction = 1,
    tracks = [0],
    userAddress,
    onSuccess,
    onFailed,
  }: {
    delegateAddress: string;
    amount: string;
    conviction?: number;
    tracks?: number[];
    userAddress: string;
    onSuccess: (txHash?: string) => void;
    onFailed: (error: string) => void;
  }): Promise<void> {
    try {
      const api = await this.initApi();
      await cryptoWaitReady();

      const balance = BigInt(parseFloat(amount) * 10_000_000_000);

      const txs = tracks.map((track) =>
        api.tx.convictionVoting.delegate(
          track,
          delegateAddress,
          conviction,
          balance.toString()
        )
      );

      const tx = txs.length === 1 ? txs[0] : api.tx.utility.batchAll(txs);

      await this.executeTx({
        tx,
        address: userAddress,
        errorMessageFallback: "Failed to delegate voting power",
        onSuccess: async (txHash) => {
          onSuccess(txHash?.toString());
        },
        onFailed: async (error) => {
          console.error("Delegation failed:", error);
          onFailed(error);
        },
        waitTillFinalizedHash: true,
      });
    } catch (error) {
      console.error("Error delegating voting power:", error);
      onFailed("Failed to delegate voting power: " + (error as Error).message);
    }
  }

  /**
   * Prepare delegation transaction call data for browser wallet (legacy method)
   * @deprecated Use delegateVotingPower with callbacks instead
   */
  async prepareDelegationCallData(
    delegateAddress: string,
    amount: string,
    conviction: number = 1,
    tracks: number[] = [0]
  ): Promise<string> {
    try {
      const api = await this.initApi();
      await cryptoWaitReady();

      const balance = BigInt(parseFloat(amount) * 10_000_000_000);

      const txs = tracks.map((track) =>
        api.tx.convictionVoting.delegate(
          track,
          delegateAddress,
          conviction,
          balance.toString()
        )
      );

      const tx = txs.length === 1 ? txs[0] : api.tx.utility.batchAll(txs);

      return tx.method.toHex();
    } catch (error) {
      console.error("Error preparing delegation call data:", error);
      throw new Error(
        "Failed to prepare delegation call data: " + (error as Error).message
      );
    }
  }

  /**
   * Execute a transaction with comprehensive status tracking
   */
  private async executeTx({
    tx,
    address,
    errorMessageFallback,
    onSuccess,
    onFailed,
    onBroadcast,
    setStatus,
    waitTillFinalizedHash = false,
  }: {
    tx: SubmittableExtrinsic<"promise">;
    address: string;
    errorMessageFallback: string;
    onSuccess: (txHash?: string) => Promise<void> | void;
    onFailed: (error: string) => Promise<void> | void;
    onBroadcast?: () => void;
    setStatus?: (status: string) => void;
    waitTillFinalizedHash?: boolean;
  }): Promise<void> {
    let isFailed = false;
    const api = await this.initApi();

    return new Promise((resolve, reject) => {
      tx.signAndSend(
        address,
        async ({
          status,
          events,
          txHash,
        }: {
          status: any;
          events: EventRecord[];
          txHash: any;
        }) => {
          try {
            if (status.isInvalid) {
              setStatus?.("Transaction invalid");
              isFailed = true;
              await onFailed("Transaction invalid");
              reject(new Error("Transaction invalid"));
            } else if (status.isReady) {
              setStatus?.("Transaction is ready");
            } else if (status.isBroadcast) {
              setStatus?.("Transaction has been broadcasted");
              onBroadcast?.();
            } else if (status.isInBlock) {
              setStatus?.("Transaction is in block");

              for (const { event } of events) {
                if (event.method === "ExtrinsicSuccess") {
                  setStatus?.("Transaction Success");
                  isFailed = false;
                  if (!waitTillFinalizedHash) {
                    await onSuccess(txHash?.toString());
                    resolve();
                  }
                } else if (event.method === "ExtrinsicFailed") {
                  setStatus?.("Transaction failed");
                  isFailed = true;

                  const dispatchError = (event.data as any)?.[0];
                  let errorMessage = errorMessageFallback;

                  if (dispatchError?.isModule) {
                    const errorModule = dispatchError.asModule;
                    const { method, section, docs } =
                      api.registry.findMetaError(errorModule);
                    errorMessage = `${section}.${method}: ${docs.join(" ")}`;
                  } else if (dispatchError?.isToken) {
                    errorMessage = `${dispatchError.type}.${dispatchError.asToken.type}`;
                  } else {
                    errorMessage = dispatchError?.type || errorMessageFallback;
                  }

                  await onFailed(errorMessage);
                  reject(new Error(errorMessage));
                }
              }
            } else if (status.isFinalized) {
              setStatus?.("Transaction finalized");

              if (!isFailed && waitTillFinalizedHash) {
                await onSuccess(txHash?.toString());
              }
              resolve();
            }
          } catch (error) {
            console.error("Error in transaction callback:", error);
            await onFailed(
              (error as Error)?.toString() || errorMessageFallback
            );
            reject(error);
          }
        }
      ).catch(async (error: Error) => {
        setStatus?.("Transaction failed");
        console.error("ERROR:", error);
        await onFailed(error?.toString() || errorMessageFallback);
        reject(error);
      });
    });
  }

  /**
   * Submit a vote using the GovBot wallet (server-side voting)
   * This method is used when the GovBot makes autonomous voting decisions
   * Uses the wallet configured in environment variables (POLKADOT_WALLET_JSON)
   * @param referendumId The referendum ID to vote on
   * @param vote The vote decision (aye, nay, or abstain)
   * @param conviction The conviction multiplier for the vote (1-6)
   * @param balance Optional balance to vote with (in planck units)
   * @returns Promise<string> The transaction hash
   */
  async submitVote(
    referendumId: string,
    vote: "aye" | "nay" | "abstain",
    conviction: number = 1,
    balance?: string
  ): Promise<string> {
    try {
      const api = await this.initApi();
      await cryptoWaitReady();

      const wallet = await this.getGovBotWallet();

      if (!balance && vote !== "abstain") {
        balance = await this.getVotingPower(wallet.address);
      }

      let voteValue;
      if (vote === "aye") {
        voteValue = {
          Standard: {
            vote: { aye: true, conviction },
            balance: balance || "0",
          },
        };
      } else if (vote === "nay") {
        voteValue = {
          Standard: {
            vote: { aye: false, conviction },
            balance: balance || "0",
          },
        };
      } else {
        voteValue = {
          Standard: {
            vote: { aye: false, conviction: 0 },
            balance: "0",
          },
        };
      }

      const tx = api.tx.convictionVoting.vote(referendumId, voteValue);

      return new Promise<string>((resolve, reject) => {
        tx.signAndSend(wallet, { tip: 0, nonce: -1 }, (result) => {
          if (result.status.isInBlock) {
            console.log(
              `Transaction included in block ${result.status.asInBlock}`
            );
          }

          if (result.status.isFinalized) {
            console.log(
              `Transaction finalized in block ${result.status.asFinalized}`
            );

            const failed = result.events.find(({ event }) =>
              api.events.system.ExtrinsicFailed.is(event)
            );

            if (failed) {
              const [dispatchError] = failed.event.data;
              let errorMessage = "Transaction failed";

              try {
                const dispatchErrorData = dispatchError as any;
                if (dispatchErrorData?.isModule) {
                  const decoded = api.registry.findMetaError(
                    dispatchErrorData.asModule
                  );
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
                } else {
                  errorMessage = `Transaction failed: ${dispatchError.toString()}`;
                }
              } catch (error) {
                console.error("Error decoding dispatch error:", error);
                errorMessage = `Transaction failed: ${dispatchError.toString()}`;
              }

              reject(new Error(errorMessage));
              return;
            }

            resolve(result.txHash.toHex());
          }

          if (result.isError) {
            reject(new Error("Transaction failed with unknown error"));
          }
        }).catch((error) => {
          console.error("Error in signAndSend:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error submitting vote:", error);
      throw new Error("Failed to submit vote: " + (error as Error).message);
    }
  }

  /**
   * Client-side delegation function for browser wallet integration
   * @param selectedAccount - The wallet account to use for signing
   * @param amount - The amount to delegate (in DOT)
   * @param conviction - The conviction multiplier (1-6)
   * @param delegateAddress - The address to delegate to
   * @param tracks - Array of track IDs to delegate on (optional, defaults to all governance tracks)
   * @returns Promise<string> - The transaction hash
   */
  async delegateVotingPowerClient(
    selectedAccount: WalletAccount,
    amount: string,
    conviction: number,
    delegateAddress: string,
    tracks: number[] = [
      0, 2, 34, 33, 32, 31, 30, 11, 1, 10, 12, 13, 14, 15, 20, 21,
    ]
  ): Promise<string> {
    try {
      const { ApiPromise, WsProvider } = await import("@polkadot/api");
      const { web3FromAddress } = await import("@polkadot/extension-dapp");

      const wsProvider = new WsProvider("wss://rpc.polkadot.io");
      const api = await ApiPromise.create({ provider: wsProvider });

      const injector = await web3FromAddress(selectedAccount.address);

      const balance = BigInt(parseFloat(amount) * 10_000_000_000);

      const txs = tracks.map((track) =>
        api.tx.convictionVoting.delegate(
          track,
          delegateAddress,
          conviction,
          balance.toString()
        )
      );

      const tx = txs.length === 1 ? txs[0] : api.tx.utility.batchAll(txs);

      const result = await new Promise<string>((resolve, reject) => {
        tx.signAndSend(
          selectedAccount.address,
          { signer: injector.signer as any },
          (result: unknown) => {
            const submittableResult = result as {
              status: {
                isInBlock: boolean;
                isFinalized: boolean;
                asInBlock: unknown;
                asFinalized: unknown;
              };
              txHash: { toHex: () => string };
              isError: boolean;
            };

            if (submittableResult.status.isInBlock) {
              console.log(
                `Transaction in block: ${submittableResult.status.asInBlock}`
              );
              resolve(submittableResult.txHash.toHex());
            } else if (submittableResult.status.isFinalized) {
              console.log(
                `Transaction finalized: ${submittableResult.status.asFinalized}`
              );
            } else if (submittableResult.isError) {
              reject(new Error("Transaction failed"));
            }
          }
        ).catch(reject);
      });

      await api.disconnect();

      return result;
    } catch (error) {
      console.error("Error in client-side delegation:", error);
      throw new Error(
        `Failed to delegate voting power: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get block timestamp from a block number
   * @param blockNumber The block number to get timestamp for
   * @returns Promise<Date> The timestamp when the block was created
   */
  async getBlockTimestamp(blockNumber: string | number): Promise<Date> {
    try {
      const api = await this.initApi();
      const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
      const block = await api.rpc.chain.getBlock(blockHash);
      const timestampExtrinsic = block.block.extrinsics.find(
        (ext) =>
          ext.method.section === "timestamp" && ext.method.method === "set"
      );

      if (timestampExtrinsic) {
        const timestamp = timestampExtrinsic.method.args[0].toString();
        return new Date(parseInt(timestamp));
      }

      const apiAt = await api.at(blockHash);
      const timestamp = await apiAt.query.timestamp.now();
      return new Date(parseInt(timestamp.toString()));
    } catch (error) {
      console.error("Error getting block timestamp:", error);
      throw new Error(
        "Failed to get block timestamp: " + (error as Error).message
      );
    }
  }

  /**
   * Get detailed balance information for any address
   * @param address Optional address to check (defaults to GovBot wallet address)
   * @returns Promise with detailed balance information
   */
  async getDetailedBalance(address?: string): Promise<{
    address: string;
    free: string;
    reserved: string;
    frozen: string;
    total: string;
    transferable: string;
    formatted: {
      free: string;
      reserved: string;
      frozen: string;
      total: string;
      transferable: string;
    };
  }> {
    try {
      const api = await this.initApi();

      let targetAddress = address;
      if (!targetAddress) {
        try {
          const wallet = await this.getGovBotWallet();
          targetAddress = wallet.address;
        } catch {
          targetAddress = process.env.POLKADOT_BOT_ADDRESS;
        }
      }

      if (!targetAddress) {
        throw new Error(
          "No address provided and unable to determine wallet address"
        );
      }

      const accountInfo = (await api.query.system.account(
        targetAddress
      )) as AccountInfo;

      const free = accountInfo.data.free.toString();
      const reserved = accountInfo.data.reserved.toString();
      const frozen = accountInfo.data.miscFrozen?.toString() || "0";

      const freeAmount = BigInt(free);
      const reservedAmount = BigInt(reserved);
      const frozenAmount = BigInt(frozen);
      const totalAmount = freeAmount + reservedAmount;
      const transferableAmount =
        freeAmount > frozenAmount ? freeAmount - frozenAmount : BigInt(0);

      const formatAmount = (amount: bigint): string => {
        return (Number(amount) / 10_000_000_000).toFixed(10);
      };

      return {
        address: targetAddress,
        free,
        reserved: reserved,
        frozen: frozen,
        total: totalAmount.toString(),
        transferable: transferableAmount.toString(),
        formatted: {
          free: formatAmount(freeAmount),
          reserved: formatAmount(reservedAmount),
          frozen: formatAmount(frozenAmount),
          total: formatAmount(totalAmount),
          transferable: formatAmount(transferableAmount),
        },
      };
    } catch (error) {
      console.error("Error getting detailed balance:", error);
      throw new Error(
        "Failed to get detailed balance: " + (error as Error).message
      );
    }
  }
}

export const polkadotService = PolkadotService.getInstance();
