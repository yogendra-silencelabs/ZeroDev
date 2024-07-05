import * as viem from "viem";
import { publicKeyToAddress, toAccount } from "viem/accounts";
import { ProjectivePoint } from "@noble/secp256k1";
import * as sdk from "./srcMpc/lib/sdk";
import path from "path";
import fs, { promises } from "fs";
import prettier from "prettier";
import config from "./config.json";
import { Wallet, ethers } from "ethers";
import { sign } from "crypto";
/**
 * Create a new viem custom account for signing transactions using
 * the MPC network.
 * @param clusterConfig The network cluster configuration.
 * @param keyId The selected Key ID.
 * @param publicKey Associated public key of the selected Key ID.
 * @param threshold The threshold.
 */

export async function generateSilentWallet() {
  await sdk.initPairing();
  await sdk.runPairing();
  const keygen = await sdk.runKeygen();

  const CONFIG_PATH = path.resolve(__dirname, "./config.json");

  fs.writeFile(
    CONFIG_PATH,
    await prettier.format(JSON.stringify({ keygen }, null, 2), {
      parser: "json",
    }),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  const publicKey = keygen.distributedKey.publicKey as viem.Hex;
  console.log("PublicKey", publicKey);
  const address = computeAddress(publicKey);
  console.log("Address", address);
  return { publicKey, address };
}

export async function signMessageWithSilentWallet(
  message: any
): Promise<string> {
  const hexMessage = viem.toPrefixedMessage(message);
  const messageDigest = viem.hashMessage(message);
  const CONFIG_PATH = path.resolve(__dirname, "./config.json");
  const data = await promises.readFile(CONFIG_PATH, "utf8");
  const keygen2 = JSON.parse(data);
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
  console.log("recoverId", recid);

  const signature1: viem.Signature = {
    r,
    s,
    v: recid === 0 ? BigInt(27) : BigInt(28),
    yParity: recid,
  };

  const signedMsg = viem.serializeSignature(signature1);
  console.log("signedMessage", signedMsg);

  return signedMsg;
}

function createEthereumKeyPair() {
  // Create a new Wallet instance which generates a new private key
  const wallet = Wallet.createRandom();

  // Get the private key and public key
  const privateKey = wallet.privateKey;
  const publicKey = wallet.publicKey;
  const address: viem.Hex = wallet.address as viem.Hex;
  console.log("pub, priv, add", publicKey, privateKey, address);
  return { privateKey, publicKey, address };
}

async function signMessageWithPrivateKey(
  message: string,
  privateKey: string
): Promise<viem.Hex> {
  const wallet = new Wallet(privateKey);

  // Sign the message
  const signature = await wallet.signMessage(message);
  console.log("signature from signMessageWithPrivateKey", signature);

  //   const signBytes = Buffer.from(signature, "hex");
  //   const r = viem.toHex(signBytes.subarray(0, 32));
  //   const s = viem.toHex(signBytes.subarray(32, 64));
  //   const v
  //   const recid = signature.recId;
  //   let recId =
  //   console.log("recoverId", recid);
//   const splitSignature = ethers.utils.splitSignature(signature);
//   const v = `${splitSignature.v}` as viem.Hex;
//   const r = `${splitSignature.r}` as viem.Hex;
//   const s = `${splitSignature.s}` as viem.Hex;
//   const recId = splitSignature.recoveryParam;

//   // get recId from v
//   console.log("v", v);
//   console.log("r", r);
//   console.log("s", s);

//   const signature1: viem.Signature = {
//     r,
//     s,
//     v: recId === 0 ? BigInt(27) : BigInt(28),
//     yParity: recId,
//   };

//   const signatureUsingViem = viem.serializeSignature(signature1);
//   console.log("signature using viem parsing", signatureUsingViem);

  return signature as viem.Hex;
}



export function createViemAccount(privateKey: viem.Hex): viem.LocalAccount {
  //   const publicKey ="0x048999f0cb5370ec79816c61528c2a1d904208dbca158bf50e747b961d9160611869817932f2c12979923c7f6caccc16cad01dceda7f69e4b2f7d9783877c937f4"
//   let { privateKey, publicKey, address } = createEthereumKeyPair();
let wallet = new Wallet(privateKey);
let address = wallet.address as viem.Hex;
let publicKey = wallet.publicKey
console.log("address of myAccount", address);
console.log("publicKey of myAccount", publicKey);

  //   const address = "0xe727AB47B0060d0B9775d86eF20e51329A0d0409";
  return toAccount({
    address,
    async signMessage({ message }: {message: viem.SignableMessage}): Promise<`0x${string}`> {
      const sign = await signMessageWithSilentWallet(message);
      console.log("message obj?", message);

      // handle message as string or object
      let messageString: viem.Hex;
      if (typeof message !== "string") {
        // console.log("inside type msg prp", message);
        messageString = `0x${message.raw.slice(2)}`;
      }
      else {
        messageString = `0x${message.slice(2)}`;
      }
      const sign = await signMessageWithPrivateKey(messageString, privateKey);
      console.log("verify message props INSIDE", address, messageString, sign);
      let messageCheck = await viem.verifyMessage({ message: messageString, signature:sign, address: address });
      console.log("messageCheck", messageCheck);
      return sign;
    },
    async signTransaction(transaction) {
      const sign = await signMessageWithSilentWallet(transaction);
      return `0x${sign}`;
    },
    async signTypedData(typedData) {
      const sign = await signMessageWithSilentWallet(typedData);
      return `0x${sign}`;
    },
  });
}

function computeAddress(publicKey: string): viem.Address {

  return publicKeyToAddress(`0x${publicKey}`);
}
