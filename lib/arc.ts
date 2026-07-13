/**
 * Shared Arc Testnet config + viem clients for Praeco.
 * Constants mirror Circle's @circle-fin/x402-batching SDK + reference repo.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
} from "viem";
import { arcTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export const ARC_TESTNET_USDC =
  "0x3600000000000000000000000000000000000000" as const;
export const ARC_TESTNET_RPC = "https://rpc.testnet.arc.network";
export const ARC_TESTNET_NETWORK = "eip155:5042002";
export const ARC_TESTNET_GATEWAY_WALLET =
  "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" as const;
export const ARC_EXPLORER = "https://testnet.arcscan.app";
/** Circle's testnet faucet - where citizens claim free Arc test USDC. */
export const ARC_FAUCET = "https://faucet.circle.com";

/** Build an Arc Testnet block-explorer link for a tx hash. */
export function explorerTx(hash: string) {
  return `${ARC_EXPLORER}/tx/${hash}`;
}

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
});

/** A viem wallet client bound to a given private key. */
export function walletClientFor(privateKey: Hex) {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: arcTestnet,
    transport: http(ARC_TESTNET_RPC),
  });
}

/** The treasury/funder wallet - pre-funds every custodial reader. */
export function treasuryKey(): Hex {
  const key = process.env.BUYER_PRIVATE_KEY as Hex | undefined;
  if (!key) throw new Error("Missing BUYER_PRIVATE_KEY (run npm run generate-wallets)");
  return key;
}
