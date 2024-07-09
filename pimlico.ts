import { messagePrefix } from "@ethersproject/hash";
import { SignMessage1 } from "@silencelaboratories/ecdsa-tss/lib/esm/ecdsa/signature/SignMessage1";
import { Wallet, ethers } from "ethers";

import { walletClientToSmartAccountSigner } from "permissionless";
import { serialize } from "v8";
import {
  Hex,
  Signature,
  TransactionSerializedLegacy,
  bytesToHex,
  concat,
  createPublicClient,
  createWalletClient,
  custom,
  hashMessage,
  hashTypedData,
  http,
  keccak256,
  serializeSignature,
  stringToBytes,
  stringToHex,
  toBytes,
  toHex,
  toPrefixedMessage,
  verifyMessage,
} from "viem";
import {
  generatePrivateKey,
  sign,
  signMessage,
  signTransaction,
  signTypedData,
  toAccount,
} from "viem/accounts";
import { sepolia } from "viem/chains";
import { keygen } from "./config.json";
import * as sdk from "./srcMpc/lib/sdk";
import { splitSignature } from "ethers/lib/utils";


async function signMessageWithPrivateKey(message: string, privateKey: string) {
  const wallet = new Wallet(privateKey);

  // Sign the message
  console.log("message in sign with private", message);
  const messageConv = toBytes(message);
  const signature = await wallet.signMessage(messageConv);
  const { v, r, recoveryParam, s } = splitSignature(signature);
  console.log("signature from signMessageWithPrivateKey", signature);

  return { signature, v, r, s, recoveryParam };
}


export async function signMessageWithSilentWallet(message: string) {
  console.log("signMessageWithSilentWallet message", message);
  const messageToBytes =  toBytes(message);
  const messageWithPrefix = toPrefixedMessage({raw : messageToBytes});
  const messageDigest = hashMessage({raw : messageToBytes});
  const d = {
    hashAlg: "keccak256",
    message: messageWithPrefix,
    messageHashHex: messageDigest,
    signMetadata: "eth_sign",
    accountId: keygen.distributedKey.accountId,
    keyShare: keygen.distributedKey.keyShareData,
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
  const r = toHex(signBytes.subarray(0, 32));
  const s = toHex(signBytes.subarray(32, 64));
  const recid = signature.recId;
  const v = recid === 0 ? BigInt(27) : BigInt(28);
 
  return { signature, r, s, v, recid };
}

const privateKey = generatePrivateKey();

const wallet = new Wallet(privateKey);

console.log("wallet", wallet.publicKey);

const address = wallet.address;

const account = toAccount({
  address: address as `0x${string}`,
  source: "privateKey",
  nonceManager: undefined,
  type: "local", // Ensure this is the literal "local"
  publicKey: wallet.publicKey as `0x${string}`,
  async signMessage({ message }) {
    console.log("message obj?", message);
    let messageString: Hex | string;
    let messageBytes: Uint8Array;

    message = (() => {
      if (typeof message === "string") {
        console.log("Message is a string");
        return stringToHex(message);
      }
      if (typeof message.raw === "string") {
        console.log("Message.raw is a string");
        return message.raw;
      }
      console.log("Message.raw is not a string");
      return bytesToHex(message.raw);
    })();
    
    const sign = await signMessageWithSilentWallet(message);
    console.log("verify message props INSIDE", address, message, sign);
    // const messageCheck = verifyMessage({ address:address as Hex, message, signature: `0x${ sign.signature}` });

   

    const signature: Signature = {
      r: sign.r as Hex,
      s: sign.s as Hex,
      v: sign.recid === 0 ? BigInt(27) : BigInt(28),
      yParity: sign.recid,
    };
    console.log("serialized signature", serializeSignature(signature));
    return serializeSignature(signature);
  },
  //   async signMessage({ message }) {
  //     return signMessage({ message, privateKey })
  //   },
  async signTransaction(
    transaction: any
  ): Promise<
    | `0x02${string}`
    | `0x01${string}`
    | `0x03${string}`
    | TransactionSerializedLegacy
  > {
    console.log("signTransaction p", transaction);
    return await signTransaction({ transaction, privateKey });
  },
  async signTypedData(typedData) {
    return signTypedData({ ...typedData, privateKey });
  },
});

const client = createPublicClient({
  chain: sepolia,
  transport: http(
    "https://rpc.zerodev.app/api/v2/bundler/521c47a3-535f-46db-ba5d-e0084aa0eedf"
  ),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(
    "https://rpc.zerodev.app/api/v2/bundler/521c47a3-535f-46db-ba5d-e0084aa0eedf"
  ),
});

const smartAccountSigner = walletClientToSmartAccountSigner(walletClient);

export { smartAccountSigner };
