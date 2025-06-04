import { BN } from "@polkadot/util";
import { ENetwork } from "./types";

export type NetworkId = "polkadot" | "paseo";

interface ITreasuryAsset {
  name: string;
  tokenDecimal: number;
  symbol: string;
}

interface INetworkTreasuryAssets extends ITreasuryAsset {
  index: string;
}

interface IRpcEndpoint {
  name: string;
  url: string;
}

interface IPeopleChainDetails {
  rpcEndpoints: IRpcEndpoint[];
  polkassemblyRegistrarIndex?: number;
  identityMinDeposit: BN;
}

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  displayName: string;
  isTestnet: boolean;
  rpcEndpoints: Array<{
    name: string;
    url: string;
  }>;
  polkassemblyUrl: string;
  subscanUrl: string;
  currency: {
    symbol: string;
    decimals: number;
  };
  tokenDecimals: number;
  supportedAssets: Record<string, INetworkTreasuryAssets>;
  ss58Format: number;
  peopleChainDetails: IPeopleChainDetails;
}

export enum EAssets {
  DED = "DED",
  USDT = "USDT",
  USDC = "USDC",
  MYTH = "MYTH",
}

export const treasuryAssetsData: Record<string, ITreasuryAsset> = {
  [EAssets.DED]: {
    name: "dot-is-ded",
    tokenDecimal: 10,
    symbol: "DED",
  },
  [EAssets.USDT]: {
    name: "usdt",
    tokenDecimal: 6,
    symbol: "USDT",
  },
  [EAssets.USDC]: {
    name: "usdc",
    tokenDecimal: 6,
    symbol: "USDC",
  },
  [EAssets.MYTH]: {
    name: "mythos",
    tokenDecimal: 18,
    symbol: "MYTH",
  },
} as const;

const PEOPLE_CHAIN_NETWORK_DETAILS: Record<ENetwork, IPeopleChainDetails> = {
  [ENetwork.POLKADOT]: {
    polkassemblyRegistrarIndex: 3,
    identityMinDeposit: new BN("2001700000"),
    rpcEndpoints: [
      {
        name: "via Parity",
        url: "wss://polkadot-people-rpc.polkadot.io",
      },
      {
        name: "via LuckyFriday",
        url: "wss://rpc-people-polkadot.luckyfriday.io",
      },
      {
        name: "via RadiumBlock",
        url: "wss://people-polkadot.public.curie.radiumblock.co/ws",
      },
      {
        name: "via IBP-GeoDNS1",
        url: "wss://sys.ibp.network/people-polkadot",
      },
      {
        name: "via IBP-GeoDNS2",
        url: "wss://people-polkadot.dotters.network",
      },
    ],
  },
  [ENetwork.PASEO]: {
    identityMinDeposit: new BN("1000000000000"),
    rpcEndpoints: [
      {
        name: "via IBP 1",
        url: "wss://sys.ibp.network/people-paseo",
      },
      {
        name: "via IBP 2",
        url: "wss://people-paseo.dotters.network",
      },
      {
        name: "via Armfoc",
        url: "wss://people-paseo.rpc.amforc.com",
      },
    ],
  },
} as const;

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  polkadot: {
    id: "polkadot",
    name: "polkadot",
    displayName: "Polkadot",
    isTestnet: false,
    rpcEndpoints: [
      {
        name: "via Parity",
        url: "wss://rpc.polkadot.io",
      },
      {
        name: "via LuckyFriday",
        url: "wss://rpc-polkadot.luckyfriday.io",
      },
      {
        name: "via RadiumBlock",
        url: "wss://polkadot.public.curie.radiumblock.co/ws",
      },
      {
        name: "via IBP-GeoDNS1",
        url: "wss://sys.ibp.network/polkadot",
      },
      {
        name: "via IBP-GeoDNS2",
        url: "wss://polkadot.dotters.network",
      },
    ],
    polkassemblyUrl: "https://polkadot.polkassembly.io",
    subscanUrl: "https://polkadot.subscan.io",
    currency: {
      symbol: "DOT",
      decimals: 10,
    },
    tokenDecimals: 10,
    supportedAssets: {
      "1984": {
        ...treasuryAssetsData[EAssets.USDT],
        index: "1984",
        tokenDecimal: 6,
      },
      "1337": {
        ...treasuryAssetsData[EAssets.USDC],
        index: "1337",
        tokenDecimal: 6,
      },
      "30": {
        ...treasuryAssetsData[EAssets.DED],
        index: "30",
      },
    },
    ss58Format: 0,
    peopleChainDetails: PEOPLE_CHAIN_NETWORK_DETAILS[ENetwork.POLKADOT],
  },
  paseo: {
    id: "paseo",
    name: "paseo",
    displayName: "Paseo Testnet",
    isTestnet: true,
    rpcEndpoints: [
      {
        name: "via IBP 1",
        url: "wss://sys.ibp.network/paseo",
      },
      {
        name: "via IBP 2",
        url: "wss://paseo.dotters.network",
      },
      {
        name: "via Armfoc",
        url: "wss://paseo.rpc.amforc.com",
      },
    ],
    polkassemblyUrl: "https://paseo.polkassembly.io",
    subscanUrl: "https://paseo.subscan.io",
    currency: {
      symbol: "PAS",
      decimals: 10,
    },
    tokenDecimals: 10,
    supportedAssets: {},
    ss58Format: 0,
    peopleChainDetails: PEOPLE_CHAIN_NETWORK_DETAILS[ENetwork.PASEO],
  },
};

export const RPC_ENDPOINTS = NETWORKS.polkadot.rpcEndpoints;

export const POLKADOT_TRACKS = {
  "0": {
    name: "Root",
    description: "Highest permission level, can change core protocol features",
  },
  "1": {
    name: "WhitelistedCaller",
    description: "Permission to call privileged functions",
  },
  "2": { name: "StakingAdmin", description: "Controls staking parameters" },
  "10": {
    name: "Treasurer",
    description: "Controls spending of treasury funds",
  },
  "11": { name: "LeaseAdmin", description: "Manages parachain slot leases" },
  "12": { name: "FellowshipAdmin", description: "Fellowship self-governance" },
  "13": { name: "GeneralAdmin", description: "For administrative matters" },
  "14": { name: "AuctionAdmin", description: "Manages parachain auctions" },
  "15": { name: "ReferendumCanceller", description: "Can cancel referenda" },
  "20": { name: "ReferendumKiller", description: "Can kill referenda" },
  "21": { name: "SmallTipper", description: "Small treasury tips" },
  "22": { name: "BigTipper", description: "Large treasury tips" },
  "30": { name: "SmallSpender", description: "Small treasury spending" },
  "31": { name: "MediumSpender", description: "Medium treasury spending" },
  "32": { name: "BigSpender", description: "Large treasury spending" },
  "33": { name: "WishForChange", description: "Wish for change proposals" },
  "34": { name: "RetainAtRank", description: "Fellowship rank retention" },
} as const;

export const VALID_TRACKS_BY_TYPE = {
  treasury: ["10", "21", "22", "30", "31", "32"] as string[],
  staking: ["2"] as string[],
  fellowship: ["12", "34"] as string[],
  admin: ["13"] as string[],
  root: ["0"] as string[],
  whitelisted: ["1"] as string[],
};

export const SCORING_CRITERIA = {
  TECHNICAL_FEASIBILITY: 0.2,
  ALIGNMENT_WITH_GOALS: 0.2,
  ECONOMIC_IMPLICATIONS: 0.15,
  SECURITY_IMPLICATIONS: 0.15,
  COMMUNITY_SENTIMENT: 0.15,
  TRACK_SPECIFIC: 0.15,
} as const;

export const DECISION_THRESHOLDS = {
  AYE: 0.8,
  ABSTAIN: 0.5,
  NAY: 0.0,
} as const;

export const CHAT_LIMITS = {
  MAX_CHATS: 10,
  WARNING_THRESHOLD: 9,
} as const;

export const OPENGOV_TRACKS = {
  ROOT: 0,
  WHITELISTED_CALLER: 1,
  STAKING_ADMIN: 2,
  TREASURER: 10,
  LEASE_ADMIN: 11,
  FELLOWSHIP_ADMIN: 12,
  GENERAL_ADMIN: 13,
  AUCTION_ADMIN: 14,
  REFERENDUM_CANCELLER: 15,
  REFERENDUM_KILLER: 20,
  SMALL_TIPPER: 21,
  BIG_TIPPER: 22,
  SMALL_SPENDER: 30,
  MEDIUM_SPENDER: 31,
  BIG_SPENDER: 32,
  WISH_FOR_CHANGE: 33,
  RETAIN_AT_RANK: 34,
} as const;

export const ALL_GOVERNANCE_TRACKS = [
  OPENGOV_TRACKS.ROOT,
  OPENGOV_TRACKS.WHITELISTED_CALLER,
  OPENGOV_TRACKS.STAKING_ADMIN,
  OPENGOV_TRACKS.TREASURER,
  OPENGOV_TRACKS.LEASE_ADMIN,
  OPENGOV_TRACKS.FELLOWSHIP_ADMIN,
  OPENGOV_TRACKS.GENERAL_ADMIN,
  OPENGOV_TRACKS.AUCTION_ADMIN,
  OPENGOV_TRACKS.REFERENDUM_CANCELLER,
  OPENGOV_TRACKS.REFERENDUM_KILLER,
  OPENGOV_TRACKS.SMALL_TIPPER,
  OPENGOV_TRACKS.BIG_TIPPER,
  OPENGOV_TRACKS.SMALL_SPENDER,
  OPENGOV_TRACKS.MEDIUM_SPENDER,
  OPENGOV_TRACKS.BIG_SPENDER,
  OPENGOV_TRACKS.WISH_FOR_CHANGE,
  OPENGOV_TRACKS.RETAIN_AT_RANK,
];
