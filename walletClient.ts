import * as viem from "viem";
import { publicKeyToAddress, toAccount } from "viem/accounts";
import * as sdk from "./srcMpc/lib/sdk";
import { Wallet } from "ethers";
import { hexZeroPad, joinSignature, splitSignature } from "ethers/lib/utils";
import { sepolia } from "viem/chains";
import { serialize } from "v8";
import config from "./config.json";

/**
 * Create a new viem custom account for signing transactions using
 * the MPC network.
 * @param clusterConfig The network cluster configuration.
 * @param keyId The selected Key ID.
 * @param publicKey Associated public key of the selected Key ID.
 * @param threshold The threshold.
 */

export async function signMessageWithSilentWallet(
  message: any
): Promise<`0x${string}`> {
  const hexMessage = viem.toPrefixedMessage(message);
  const messageDigest = viem.hashMessage(message);
  const d = {
    hashAlg: "keccak256",
    message: hexMessage,
    messageHashHex: messageDigest,
    signMetadata: "eth_sign",
    accountId: config.keygen.distributedKey.accountId,
    keyShare: config.keygen.distributedKey.keyShareData,
  };

  console.log("sending to runSign: d = ", d);
  const signature = await sdk.runSign(
    d.hashAlg,
    d.message,
    d.messageHashHex,
    "eth_sign",
    d.accountId,
    d.keyShare
  );

  const signBytes = Buffer.from(signature.signature, "hex");
  const r = viem.toHex(signBytes.subarray(0, 32));
  const s = viem.toHex(signBytes.subarray(32, 64));
  const recid = signature.recId;

  const split = splitSignature({
    recoveryParam: recid,
    r: hexZeroPad(`${r.toString()}`, 32),
    s: hexZeroPad(`${s.toString()}`, 32),
  });

  const signedMsg = joinSignature(split) as `0x${string}`;
  console.log("signedMsg", signedMsg);
  return signedMsg;
}

export async function createViemAccount(privateKey: viem.Hex): Promise<viem.Account> {
  const address = "0x6Af7dC0C6c0338c731ad2cF535cB8D992c57Ee00";

  return {
    address,
    publicKey: config.keygen.distributedKey.publicKey as viem.Hex || "0x",
    source: "custom",
    type: "local",
    signMessage: async ({
      message,
    }: {
      message: viem.SignableMessage;
    }): Promise<`0x${string}`> => {
      console.log("message obj?", message);

      let messageString: `0x${string}`;
      if (typeof message !== "string") {
        messageString = `0x${message.raw.slice(2)}`;
      } else {
        messageString = `0x${message.slice(2)}`;
      }
      const sign = await signMessageWithSilentWallet(messageString);
      console.log("verify message props INSIDE", address, messageString, sign);
      const messageCheck = await viem.verifyMessage({
        message: messageString,
        signature: sign,
        address: address,
      });
      console.log("messageCheck", messageCheck);
      return sign;
    },
    signTransaction: async (transaction: any): Promise<`0x${string}`> => {
      const sign = await signMessageWithSilentWallet(transaction);
      return sign;
    },
    signTypedData: async (typedData: any): Promise<`0x${string}`> => {
        const sign = await signMessageWithSilentWallet(typedData);
        return sign;
    },
  };
}

export async function createViemAccount1() {
  const account = await createViemAccount(
    "0x6Af7dC0C6c0338c731ad2cF535cB8D992c57Ee00"
  );
  const walletClient = viem.createWalletClient({
    account,
    chain: sepolia,
    transport: viem.http("https://rpc.ankr.com/eth_sepolia"),
  });

  console.log(walletClient);
  return walletClient;
}



