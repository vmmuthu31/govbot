"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNetwork } from "@/lib/network-context";
import { NETWORKS, NetworkId } from "@/lib/constants";

export function NetworkSelector() {
  const { selectedNetwork, setSelectedNetwork } = useNetwork();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
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
      <DropdownMenuContent align="end" className="w-56">
        {Object.values(NETWORKS).map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => setSelectedNetwork(network.id as NetworkId)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
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
                <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                  Test
                </span>
              )}
              {selectedNetwork === network.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
