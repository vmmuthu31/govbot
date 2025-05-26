"use client";

import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNetwork } from "@/lib/network-context";
import { NETWORKS, NetworkId } from "@/lib/constants";

const PolkadotLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="#E6007A" />
    <circle cx="12" cy="8" r="2" fill="white" />
    <circle cx="8" cy="14" r="2" fill="white" />
    <circle cx="16" cy="14" r="2" fill="white" />
  </svg>
);

const PaseoLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="#FF6B35" />
    <circle cx="12" cy="8" r="2" fill="white" />
    <circle cx="8" cy="14" r="2" fill="white" />
    <circle cx="16" cy="14" r="2" fill="white" />
  </svg>
);

const getNetworkIcon = (networkId: NetworkId) => {
  switch (networkId) {
    case "polkadot":
      return PolkadotLogo;
    case "paseo":
      return PaseoLogo;
    default:
      return PolkadotLogo;
  }
};

export function NetworkSelector() {
  const { selectedNetwork, setSelectedNetwork } = useNetwork();
  const CurrentNetworkIcon = getNetworkIcon(selectedNetwork);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentNetworkIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {NETWORKS[selectedNetwork].displayName}
          </span>
          {NETWORKS[selectedNetwork].isTestnet && (
            <span className="hidden sm:inline text-xs bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
              Testnet
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 border-b">
          <p className="text-sm font-medium">Select Network</p>
          <p className="text-xs text-muted-foreground">
            Choose your preferred Polkadot ecosystem network
          </p>
        </div>
        {Object.values(NETWORKS).map((network) => {
          const NetworkIcon = getNetworkIcon(network.id as NetworkId);
          return (
            <DropdownMenuItem
              key={network.id}
              onClick={() => setSelectedNetwork(network.id as NetworkId)}
              className="flex items-center justify-between cursor-pointer p-3"
            >
              <div className="flex items-center gap-3">
                <NetworkIcon className="h-5 w-5" />
                <div className="flex flex-col">
                  <span className="font-medium">{network.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {network.currency.symbol} •{" "}
                    {network.isTestnet ? "Testnet" : "Mainnet"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {network.isTestnet && (
                  <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">
                    Test
                  </span>
                )}
                {selectedNetwork === network.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
