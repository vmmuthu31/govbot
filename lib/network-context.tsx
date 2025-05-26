"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { NetworkId, NETWORKS } from "./constants";
import { NetworkContextType } from "./types";

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("polkadot");

  useEffect(() => {
    const savedNetwork = localStorage.getItem(
      "govbot-selected-network"
    ) as NetworkId;
    if (savedNetwork && NETWORKS[savedNetwork]) {
      setSelectedNetwork(savedNetwork);
    }
  }, []);

  const handleSetSelectedNetwork = (networkId: NetworkId) => {
    setSelectedNetwork(networkId);
    localStorage.setItem("govbot-selected-network", networkId);
  };

  const networkConfig = NETWORKS[selectedNetwork];

  return (
    <NetworkContext.Provider
      value={{
        selectedNetwork,
        networkConfig,
        setSelectedNetwork: handleSetSelectedNetwork,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
