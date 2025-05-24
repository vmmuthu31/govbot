/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiPromise, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import type { WalletAccount } from "@/services/wallet";
import { web3FromAddress } from "@polkadot/extension-dapp";

const wsProvider = new WsProvider("wss://rpc.polkadot.io");

/**
 * Client-side Polkadot service for browser wallet integration
 * This service contains only browser-compatible functionality
 */
class PolkadotClientService {
  private static instance: PolkadotClientService;

  private constructor() {}

  static getInstance(): PolkadotClientService {
    if (!PolkadotClientService.instance) {
      PolkadotClientService.instance = new PolkadotClientService();
    }
    return PolkadotClientService.instance;
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
      await cryptoWaitReady();
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
   * Get voting power for a given address (browser-compatible)
   */
  async getVotingPower(address: string): Promise<string> {
    try {
      const api = await ApiPromise.create({ provider: wsProvider });

      const accountInfo = await api.query.system.account(address);
      const free = (accountInfo as any).data.free.toString();
      const dotAmount = Number(free) / 10_000_000_000;

      await api.disconnect();

      return dotAmount.toString();
    } catch (error) {
      console.error("Error getting voting power:", error);
      throw new Error(
        "Failed to get voting power: " + (error as Error).message
      );
    }
  }
}

export const polkadotClientService = PolkadotClientService.getInstance();
