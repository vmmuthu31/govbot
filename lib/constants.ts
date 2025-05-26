export type NetworkId = "polkadot" | "paseo";

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
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  polkadot: {
    id: "polkadot",
    name: "polkadot",
    displayName: "Polkadot",
    isTestnet: false,
    rpcEndpoints: [
      {
        name: "Parity (recommended)",
        url: "wss://rpc.polkadot.io",
      },
      {
        name: "OnFinality",
        url: "wss://polkadot.api.onfinality.io/public-ws",
      },
      {
        name: "Dwellir",
        url: "wss://polkadot-rpc.dwellir.com",
      },
      {
        name: "PinkNode",
        url: "wss://public-rpc.pinknode.io/polkadot",
      },
      {
        name: "IBP GeoDNS1",
        url: "wss://rpc.ibp.network/polkadot",
      },
      {
        name: "IBP GeoDNS2",
        url: "wss://rpc.dotters.network/polkadot",
      },
      {
        name: "RadiumBlock",
        url: "wss://polkadot.public.curie.radiumblock.co/ws",
      },
      {
        name: "LuckyFriday",
        url: "wss://rpc-polkadot.luckyfriday.io",
      },
    ],
    polkassemblyUrl: "https://polkadot.polkassembly.io",
    subscanUrl: "https://polkadot.subscan.io",
    currency: {
      symbol: "DOT",
      decimals: 10,
    },
  },
  paseo: {
    id: "paseo",
    name: "paseo",
    displayName: "Paseo Testnet",
    isTestnet: true,
    rpcEndpoints: [
      {
        name: "Parity (recommended)",
        url: "wss://paseo-rpc.dwellir.com",
      },
      {
        name: "IBP Network",
        url: "wss://rpc.ibp.network/paseo",
      },
      {
        name: "Zondax",
        url: "wss://api2.zondax.ch/pas/node/rpc",
      },
      {
        name: "Amforc",
        url: "wss://paseo.rpc.amforc.com",
      },
    ],
    polkassemblyUrl: "https://paseo.polkassembly.io",
    subscanUrl: "https://paseo.subscan.io",
    currency: {
      symbol: "PAS",
      decimals: 10,
    },
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
