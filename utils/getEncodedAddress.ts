import { NetworkId, NETWORKS } from "@/lib/constants";
import { encodeAddress } from "@polkadot/util-crypto";

/**
 * Return an address encoded for the current network
 *
 * @param address An address
 *
 */

export function getEncodedAddress(
  address: string,
  network: NetworkId
): string | null {
  if (!network || !(network in NETWORKS) || !address) {
    return null;
  }

  const ss58Format = NETWORKS[network as NetworkId]?.ss58Format;

  if (ss58Format === undefined) {
    return null;
  }

  if (address.startsWith("0x")) return address;

  try {
    return encodeAddress(address, ss58Format);
  } catch {
    return null;
  }
}
