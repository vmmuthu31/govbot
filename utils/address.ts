import { encodeAddress, decodeAddress } from "@polkadot/util-crypto";

/**
 * Convert an address to a specific network format
 * @param address - The address to convert
 * @param ss58Format - The target SS58 format (0 for Polkadot, 42 for generic substrate)
 * @returns The converted address
 */
export function convertAddressFormat(
  address: string,
  ss58Format: number
): string {
  try {
    const publicKey = decodeAddress(address);
    return encodeAddress(publicKey, ss58Format);
  } catch (error) {
    console.error("Error converting address format:", error);
    return address;
  }
}

/**
 * Convert address to Polkadot format (SS58 format 0)
 * @param address - The address to convert
 * @returns The address in Polkadot format
 */
export function toPolkadotFormat(address: string): string {
  return convertAddressFormat(address, 0);
}

/**
 * Convert address to generic substrate format (SS58 format 42)
 * @param address - The address to convert
 * @returns The address in generic substrate format
 */
export function toSubstrateFormat(address: string): string {
  return convertAddressFormat(address, 42);
}

/**
 * Check if two addresses are the same account (regardless of format)
 * @param address1 - First address
 * @param address2 - Second address
 * @returns True if they represent the same account
 */
export function isSameAccount(address1: string, address2: string): boolean {
  try {
    const publicKey1 = decodeAddress(address1);
    const publicKey2 = decodeAddress(address2);
    return publicKey1.toString() === publicKey2.toString();
  } catch (error) {
    console.error("Error comparing addresses:", error);
    return address1 === address2;
  }
}

/**
 * Get the network-specific SS58 format for a given network
 * @param network - The network identifier
 * @returns The SS58 format number for the network
 */
export function getNetworkSS58Format(network: string): number {
  switch (network) {
    case "polkadot":
      return 0;
    case "kusama":
      return 2;
    case "paseo":
      return 0;
    default:
      return 42;
  }
}

/**
 * Convert address to the appropriate format for a specific network
 * @param address - The address to convert
 * @param network - The target network
 * @returns The address in the network's format
 */
export function toNetworkFormat(address: string, network: string): string {
  const ss58Format = getNetworkSS58Format(network);
  return convertAddressFormat(address, ss58Format);
}
