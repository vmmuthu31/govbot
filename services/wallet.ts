/* eslint-disable @typescript-eslint/no-explicit-any */

if (typeof window === "undefined") {
  throw new Error(
    "services/wallet.ts must only be imported in a browser/client component. It cannot be used in SSR or API routes. Add 'use client' directive to any component that imports this module."
  );
}

import { EWallet } from "@/lib/types";
import { APP_NAME } from "@/utils/constants";
import { getSubstrateAddress } from "@/utils/getSubstrateAddress";
import {
  Injected,
  InjectedAccount,
  InjectedAccountWithMeta,
  InjectedExtension,
  InjectedWindow,
} from "@polkadot/extension-inject/types";
import { stringToHex } from "@polkadot/util";
export interface WalletAccount {
  address: string;
  name?: string;
  source: string;
  type?: string;
  genesisHash?: string;
}

export interface ConnectedWallet {
  name: string;
  version: string;
  accounts: WalletAccount[];
}

export class WalletService {
  private static instance: WalletService;
  private connectedWallet: ConnectedWallet | null = null;
  private extensions: InjectedExtension[] = [];
  private accounts: InjectedAccountWithMeta[] = [];
  private injectedWindow: Window & InjectedWindow;
  private readonly STORAGE_KEY = "govbot_connected_wallet";
  private readonly SIGNATURE_KEY = "govbot_signature";

  private constructor(injectedWindow: Window & InjectedWindow) {
    this.injectedWindow = injectedWindow;
    this.loadPersistedWallet();
  }

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      const injectedWindow = window as Window & InjectedWindow;

      WalletService.instance = new WalletService(injectedWindow);
    }
    return WalletService.instance;
  }

  /**
   * Load persisted wallet connection from localStorage
   */
  private loadPersistedWallet(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.connectedWallet = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading persisted wallet:", error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Persist wallet connection to localStorage
   */
  private persistWallet(): void {
    if (typeof window === "undefined") return;

    if (this.connectedWallet) {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.connectedWallet)
      );
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Check which wallets are available in the browser
   */
  async getAvailableWallets(): Promise<string[]> {
    if (typeof window === "undefined") return [];

    const injectedWeb3 = (
      window as unknown as { injectedWeb3?: Record<string, unknown> }
    ).injectedWeb3;

    if (!injectedWeb3) return [];

    const availableWallets = Object.keys(injectedWeb3);

    return availableWallets.sort((a, b) => {
      if (a === "polkadot-js") return -1;
      if (b === "polkadot-js") return 1;
      return 0;
    });
  }

  /**
   * Connect to a specific wallet extension
   */
  async connectWallet(
    walletName?: string,
    skipSignature = false
  ): Promise<ConnectedWallet> {
    if (typeof window === "undefined") {
      throw new Error(
        "Wallet connection is only available in browser environment"
      );
    }

    try {
      const injectedWeb3 =
        (window as unknown as { injectedWeb3?: Record<string, unknown> })
          .injectedWeb3 || {};

      if (!walletName) {
        const availableWallets = Object.keys(injectedWeb3);
        walletName = availableWallets.includes("polkadot-js")
          ? "polkadot-js"
          : availableWallets[0];
      }

      if (!injectedWeb3[walletName]) {
        throw new Error(
          `Selected wallet "${walletName}" not found. Make sure it's installed and enabled.`
        );
      }

      const wallet = injectedWeb3[walletName] as any;
      if (!wallet || !wallet.enable) {
        throw new Error(
          `Selected wallet "${walletName}" is not properly initialized.`
        );
      }

      const TIMEOUT_MS = 60000;
      const injected = await Promise.race([
        wallet.enable("GovBot"),
        new Promise<null>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Connection to wallet "${walletName}" timed out after ${
                    TIMEOUT_MS / 1000
                  } seconds`
                )
              ),
            TIMEOUT_MS
          )
        ),
      ]);

      if (!injected) {
        throw new Error(`Failed to enable wallet "${walletName}".`);
      }

      this.extensions = [injected];

      const { web3Accounts, web3Enable } = await import(
        "@polkadot/extension-dapp"
      );

      await web3Enable("GovBot");

      this.accounts = await web3Accounts({
        ss58Format: undefined,
        accountType: ["sr25519", "ed25519", "ecdsa"],
        genesisHash: undefined,
        extensions: [walletName],
      } as any);

      const walletAccounts = this.accounts.map((account) => ({
        address: account.address,
        name: account.meta.name,
        source: account.meta.source,
        type: account.type,
        genesisHash: account.meta.genesisHash ?? undefined,
      }));

      if (walletAccounts.length === 0) {
        throw new Error(
          `No accounts found in ${walletName}. Please create an account in your wallet extension.`
        );
      }

      this.connectedWallet = {
        name: walletName,
        version: injected.version || "unknown",
        accounts: walletAccounts,
      };

      if (!skipSignature && walletAccounts.length > 0) {
        try {
          const { WEB3_AUTH_SIGN_MESSAGE } = await import("@/utils/constants");
          const firstAccount = walletAccounts[0];

          const signature = await this.requestSignature({
            address: firstAccount.address,
            message: WEB3_AUTH_SIGN_MESSAGE,
          });

          if (signature) {
            localStorage.setItem(
              this.SIGNATURE_KEY,
              JSON.stringify({
                address: firstAccount.address,
                signature,
                timestamp: Date.now(),
              })
            );
          } else {
            console.warn("User rejected signature request");
          }
        } catch (error) {
          console.error("Error requesting signature:", error);
        }
      }

      this.persistWallet();

      return this.connectedWallet;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    }
  }

  /**
   * Request a signature from a specific account
   */
  async requestSignature({
    address,
    message,
  }: {
    address: string;
    message: string;
  }): Promise<string | null> {
    if (!this.connectedWallet) {
      throw new Error("No wallet connected");
    }

    try {
      const { web3FromAddress } = await import("@polkadot/extension-dapp");
      const injector = await web3FromAddress(address);

      if (!injector.signer || !injector.signer.signRaw) {
        throw new Error("Signer not available for this account");
      }

      const { stringToHex } = await import("@polkadot/util");

      const { signature } = await injector.signer.signRaw({
        address,
        data: stringToHex(message),
        type: "bytes",
      });

      return signature;
    } catch (error) {
      console.error("Error requesting signature:", error);
      return null;
    }
  }

  /**
   * Verify a previously stored signature
   */
  verifyStoredSignature(): { isValid: boolean; address: string | null } {
    try {
      const storedData = localStorage.getItem(this.SIGNATURE_KEY);
      if (!storedData) {
        return { isValid: false, address: null };
      }

      const { address, timestamp, signature } = JSON.parse(storedData);

      const isValid =
        !!signature && Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000;

      return { isValid, address };
    } catch (error) {
      console.error("Error verifying stored signature:", error);
      return { isValid: false, address: null };
    }
  }

  /**
   * Get connected wallet info
   */
  getConnectedWallet(): ConnectedWallet | null {
    return this.connectedWallet;
  }

  /**
   * Verify wallet connection is still valid and refresh if needed
   */
  async verifyAndRefreshConnection(): Promise<ConnectedWallet | null> {
    if (!this.connectedWallet) {
      return null;
    }

    try {
      const availableWallets = await this.getAvailableWallets();
      if (
        !this.connectedWallet ||
        !availableWallets.includes(this.connectedWallet.name)
      ) {
        console.log(
          `Wallet ${
            this.connectedWallet?.name || "unknown"
          } is no longer available`
        );
        this.disconnect();
        return null;
      }

      const { isValid, address } = this.verifyStoredSignature();
      if (!isValid) {
        console.log(
          "Wallet signature is invalid or expired, requesting new one"
        );
        if (this.connectedWallet && this.connectedWallet.accounts.length > 0) {
          const firstAccount = address
            ? this.connectedWallet.accounts.find(
                (acc) => acc.address === address
              ) || this.connectedWallet.accounts[0]
            : this.connectedWallet.accounts[0];

          try {
            const { WEB3_AUTH_SIGN_MESSAGE } = await import(
              "@/utils/constants"
            );
            await this.requestSignature({
              address: firstAccount.address,
              message: WEB3_AUTH_SIGN_MESSAGE,
            });
          } catch (error) {
            console.warn("Error refreshing signature:", error);
          }
        }
      }

      const injectedWeb3 =
        (window as unknown as { injectedWeb3?: Record<string, unknown> })
          .injectedWeb3 || {};

      const walletName = this.connectedWallet.name;
      const wallet = injectedWeb3[walletName] as any;
      if (!wallet || !wallet.enable) {
        console.log(`Wallet ${walletName} is not properly initialized`);
        this.disconnect();
        return null;
      }

      try {
        if (!wallet) {
          console.log(`Wallet object is null`);
          this.disconnect();
          return null;
        }

        const TIMEOUT_MS = 60000;
        const injected = await Promise.race([
          wallet.enable("GovBot"),
          new Promise<null>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Connection to wallet "${
                      this.connectedWallet?.name ?? "unknown"
                    }" timed out after ${TIMEOUT_MS / 1000} seconds`
                  )
                ),
              TIMEOUT_MS
            )
          ),
        ]);

        if (!injected) {
          console.log(`Failed to enable wallet ${this.connectedWallet.name}`);
          this.disconnect();
          return null;
        }
        this.extensions = [injected];
      } catch (error) {
        console.error("Error enabling wallet extension:", error);
        this.disconnect();
        return null;
      }

      const { web3Accounts, web3Enable } = await import(
        "@polkadot/extension-dapp"
      );

      await web3Enable("GovBot");

      this.accounts = await web3Accounts({
        ss58Format: undefined,
        accountType: ["sr25519", "ed25519", "ecdsa"],
        genesisHash: undefined,
        extensions: [this.connectedWallet.name],
      } as any);

      const currentWalletAccounts = this.accounts.map((account) => ({
        address: account.address,
        name: account.meta.name,
        source: account.meta.source,
        type: account.type,
        genesisHash: account.meta.genesisHash ?? undefined,
      }));

      if (currentWalletAccounts.length === 0) {
        console.log(
          `No accounts available in wallet ${this.connectedWallet.name}`
        );
        this.disconnect();
        return null;
      }

      this.connectedWallet.accounts = currentWalletAccounts;
      this.persistWallet();

      return this.connectedWallet;
    } catch (error) {
      console.error("Error verifying wallet connection:", error);
      this.disconnect();
      return null;
    }
  }

  /**
   * Get all available accounts
   */
  getAccounts(): WalletAccount[] {
    return this.connectedWallet?.accounts || [];
  }

  /**
   * Sign a transaction with the specified account
   */
  async signTransaction(
    address: string,
    transaction: unknown
  ): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error("No wallet connected");
    }

    try {
      const { web3FromAddress } = await import("@polkadot/extension-dapp");
      const injector = await web3FromAddress(address);

      if (!injector.signer) {
        throw new Error("Signer not available");
      }

      const signed = await (
        transaction as unknown as {
          signAsync: (
            address: string,
            options: { signer: unknown }
          ) => Promise<{ toHex: () => string }>;
        }
      ).signAsync(address, {
        signer: injector.signer,
      });

      return signed.toHex();
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(
    address: string,
    transaction: unknown
  ): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error("No wallet connected");
    }

    try {
      return await this.signTransaction(address, transaction);
    } catch (error) {
      console.error("Error submitting transaction:", error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.connectedWallet = null;
    this.extensions = [];
    this.accounts = [];

    if (typeof window !== "undefined") {
      localStorage.removeItem(this.SIGNATURE_KEY);
    }

    this.persistWallet();
  }

  async getAddressesFromWallet(
    selectedWallet: EWallet
  ): Promise<InjectedAccount[]> {
    const { isWeb3Injected } = await import("@polkadot/extension-dapp");

    const wallet =
      typeof window !== "undefined" && isWeb3Injected
        ? this.injectedWindow.injectedWeb3[String(selectedWallet)]
        : null;
    if (!wallet) {
      return [];
    }

    let injected: Injected | undefined;
    try {
      injected = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Wallet Timeout"));
        }, 60000);

        if (wallet && wallet.enable) {
          wallet
            .enable(APP_NAME)
            .then((value) => {
              clearTimeout(timeoutId);
              resolve(value);
            })
            .catch((error) => {
              reject(error);
            });
        }
      });
      if (!injected) {
        return [];
      }

      return await injected.accounts.get();
    } catch {
      // TODO: show notification
      return [];
    }
  }

  getInjectedWallets() {
    return this.injectedWindow.injectedWeb3 || {};
  }

  async signMessage({
    data,
    address,
    selectedWallet,
  }: {
    data: string;
    address: string;
    selectedWallet: EWallet;
  }) {
    const { isWeb3Injected } = await import("@polkadot/extension-dapp");
    const wallet =
      typeof window !== "undefined" && isWeb3Injected
        ? this.injectedWindow.injectedWeb3[String(selectedWallet)]
        : null;

    if (!wallet) {
      return null;
    }

    let injected: Injected | undefined;
    try {
      if (!wallet.enable) {
        console.error("Wallet enable function is not available");
        return null;
      }

      injected = await Promise.race([
        wallet.enable(APP_NAME),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Wallet connection timed out")),
            60000
          )
        ),
      ]);
    } catch (error) {
      console.error("Error enabling wallet for signing:", error);
      return null;
    }

    if (!injected || !injected.signer || !injected.signer.signRaw) {
      console.error("Signer not available for message signing");
      return null;
    }

    const signRaw = injected.signer.signRaw;

    let substrateAddress;
    if (!address.startsWith("0x")) {
      substrateAddress = getSubstrateAddress(address);
      if (!substrateAddress) {
        // TODO: show notification
        return null;
      }
    } else {
      substrateAddress = address;
    }

    const { signature } = await signRaw({
      address: substrateAddress,
      data: stringToHex(data),
      type: "bytes",
    });

    return signature;
  }

  static getWalletNameLabel(wallet: EWallet) {
    return wallet === EWallet.SUBWALLET
      ? wallet.charAt(0).toUpperCase() + wallet.slice(1).split("-")[0]
      : wallet.charAt(0).toUpperCase() + wallet.slice(1).replace("-", ".");
  }
}

export const walletService = WalletService.getInstance();
