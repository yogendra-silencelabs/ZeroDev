// import { ethers } from "ethers";
// import * as sdk from "./srcMpc/lib/sdk";
// // import {keygen} from "./configCheck.json"
// import {
//   SignMessageReturnType,
//   createWalletClient,
//   http,
//   Hex,
//   keccak256,
//   TypedData,
//   ToHexErrorType,
//   SignMessageErrorType,
//   SignTransactionErrorType,
//   stringToBytes,
//   signatureToHex,
  
// } from "viem";
// import {
//   publicKeyToAddress,
//   signTransaction,
//   signTypedData,
//   toAccount,
//   type SignTypedDataErrorType,
//   ToAccountErrorType,
//   PublicKeyToAddressErrorType,
//   sign,
// } from "viem/accounts";
// // import { hashMessage, hexlify } from "ethers/lib/utils";
// import { hashMessage } from "viem";
// import { mainnet } from "viem/chains";
// import {
//   hexZeroPad,
//   joinSignature,
//   splitSignature,
//   toUtf8Bytes,
//   concat,
// } from "ethers/lib/utils";
// import { Config } from "prettier";
// import fs, { promises } from "fs";
// import prettier from "prettier";
// import path, { resolve } from "path";
// import { TypedDataDefinition } from "viem"; // Import the missing TypedDataDefinition type from the correct module
// import { ErrorType } from "permissionless/errors/utils";
// import { Account } from "@ethereumjs/util";
// import { SignMetadata } from "./srcMpc/types";
// import { presignMessagePrefix } from "viem";
// import { add } from "libsodium-wrappers";
// import type {  SignableMessage } from "viem/types/misc";

// export type PrivateKeyToAccountErrorType =
//   | ToAccountErrorType
//   | ToHexErrorType
//   | PublicKeyToAddressErrorType
//   | SignMessageErrorType
//   | SignTransactionErrorType
//   | SignTypedDataErrorType
//   | ErrorType;

//  export type SignMessageParameters = {
//     /** The message to sign. */
//     message: SignableMessage
//     /** The private key to sign with. */
//     privateKey: Hex
//   }
  
//   export type SignParameters = {
//     hash: Hex
//     privateKey: Hex
//   }
  
//   async function signMessageWithEOA(message: string, privateKey: string): Promise<`0x${string}`> {
//     const wallet = new ethers.Wallet(privateKey);
//     const messageHash = keccak256(toUtf8Bytes(message));
//     const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
//     // Ensure the signature is prefixed with "0x"
//     return signature.startsWith("0x") ? signature as `0x${string}` : `0x${signature}` as `0x${string}`;
//   }

// export async function generateSilentWallet() {
//   await sdk.initPairing();
//   await sdk.runPairing();
//   const keygen = await sdk.runKeygen();

//   const CONFIG_PATH = path.resolve(__dirname, "./config.json");

//   fs.writeFile(
//     CONFIG_PATH,
//     await prettier.format(JSON.stringify({ keygen }, null, 2), {
//       parser: "json",
//     }),
//     (err) => {
//       if (err) {
//         console.error(err);
//       }
//     }
//   );

//   const publicKey = keygen.distributedKey.publicKey as Hex;
//   console.log("PublicKey", publicKey);
//   const address = ethers.utils.computeAddress(`0x04${publicKey}`) as Hex;
//   console.log("Address", address);
//   return { publicKey, address };
// }

// export async function signMessageWithSilentWallet(
//   message: any
// ): Promise<SignMessageReturnType> {
 
//   console.log("messageCheck", message);
//   const messageDigest = keccak256(message.raw);
//   console.log("messageDigest", messageDigest);

//   const CONFIG_PATH = path.resolve(__dirname, "./config.json");
//   const data = await promises.readFile(CONFIG_PATH, "utf8");
//   const keygen2 = JSON.parse(data);
//   const d = {
//     hashAlg: "keccak256",
//     message: message.raw,
//     messageHashHex: messageDigest,
//     signMetadata: "eth_sign",
//     accountId: keygen2.keygen.distributedKey.accountId,
//     keyShare: keygen2.keygen.distributedKey.keyShareData,
//   };

//   console.log("sending to runSign: d = ", d);
//   const signature = await sdk.runSign(
//     d.hashAlg,
//     d.message,
//     d.messageHashHex,
//     "eth_sign",
//     d.accountId,
//     d.keyShare
//   );
//   const signBytes = Buffer.from(signature.signature, "hex");
//   const r = signBytes.subarray(0, 32);
//   const s = signBytes.subarray(32, 64);
//   const recid = signature.recId;

//   const split = splitSignature({
//     recoveryParam: recid,
//     r: hexZeroPad(`0x${r.toString("hex")}`, 32),
//     s: hexZeroPad(`0x${s.toString("hex")}`, 32),
//   });

//   const signedMsg = joinSignature(split) as Hex;
//   console.log("signedMsg", signedMsg);
//   return signedMsg;
// }




// export async function silentWalletToAccount(privateKey: Hex) {
//   const { publicKey, address } = await generateSilentWallet();
//   await sdk.runBackup();
//   await new Promise<void>((resolve) =>
//     setTimeout(() => {
//       console.log("first timeout");
//       resolve();
//     }, 5000)
//   );
//   console.log("silentWalletToAccount function");
  
//   // create account
//   const account: any = toAccount({
//     address,
//     async signMessage({ message }) {
//       const messageString = message as string;
//       const sign = await signMessageWithSilentWallet(messageString);
//       const signature 
//       return v (sign);
//     },
//     async signTransaction(transaction, { serializer } = {}) {
//       console.log("transaction", transaction);
//       return signTransaction({ privateKey, transaction, serializer });
      
//     },
//     async signTypedData(typedData) {
//       console.log("signTypedData", typedData)
//       return signTypedData({ ...typedData, privateKey })
//     },
//   });

//   return {
//     ...account,
//     publicKey,
//     source: "privateKey",
//   };
// }


import { Hex, PrivateKeyAccount, SignMessageReturnType, SignableMessage, createWalletClient, getAddress, http, keccak256, signatureToHex, stringToBytes, toHex, verifyMessage } from 'viem'
import {  
  signMessage, 
  signTransaction, 
  signTypedData, 
  privateKeyToAddress,
  toAccount, 
  publicKeyToAddress
} from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { secp256k1 } from '@noble/curves/secp256k1'
import { ethers } from 'ethers';
import { concat, hashMessage, hexZeroPad, hexlify, joinSignature, splitSignature, toUtf8Bytes } from 'ethers/lib/utils';
import * as sdk from "./srcMpc/lib/sdk";
import path, { format } from 'path';
import fs, { promises } from "fs";
import prettier from "prettier";
import * as viem from 'viem';


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

  const publicKey = keygen.distributedKey.publicKey as Hex;
  console.log("PublicKey", publicKey);
  const address = ethers.utils.computeAddress(`0x04${publicKey}`) as Hex;
  console.log("Address", address);
  return { publicKey, address };
}



export async function signMessageWithSilentWallet(
  message: any
): Promise<SignMessageReturnType> {
  const messagePrefix = "\x19Ethereum Signed Message:\n";
  const messageBytes = stringToBytes(message.raw);

  const messageSome = concat([
    toUtf8Bytes(messagePrefix),
    toUtf8Bytes(String(messageBytes.length)),
    messageBytes,
]);
 console.log("message",message)
 const hexMessage = hexlify(messageSome);
 
  const messageDigest = hashMessage(messageBytes);
  console.log("messageDigest", messageDigest);

  const CONFIG_PATH = path.resolve(__dirname, "./config.json");
  const data = await promises.readFile(CONFIG_PATH, "utf8");
  const keygen2 = JSON.parse(data);
  const d = {
    hashAlg: "keccak256",
    message: hexMessage,
    messageHashHex: messageDigest,
    signMetadata: "eth_sign",
    accountId: keygen2.keygen.distributedKey.accountId,
    keyShare: keygen2.keygen.distributedKey.keyShareData,
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
  console.log("recoverId",recid)

  const signature1 : viem.Signature = {
    r,
    s,
    v: recid === 0 ? BigInt(27) : BigInt(28),
    yParity: recid,
  };
  
  const signedMsg = viem.serializeSignature(signature1);

  // const split = splitSignature({
  //   recoveryParam: recid,
  //   r: hexZeroPad(`0x${r.toString("hex")}`, 32),
  //   s: hexZeroPad(`0x${s.toString("hex")}`, 32),
  // });

  // const signedMsg = joinSignature(split) as Hex;

  // console.log("signedMsg", signedMsg);
  return signedMsg;
}

export async function createAccount (privateKey: Hex){
const publicKeyDistribute ="0x048999f0cb5370ec79816c61528c2a1d904208dbca158bf50e747b961d9160611869817932f2c12979923c7f6caccc16cad01dceda7f69e4b2f7d9783877c937f4"

const publicKey = publicKeyDistribute as Hex
const address = "0xe727AB47B0060d0B9775d86eF20e51329A0d0409"
// const publicKey = toHex(secp256k1.getPublicKey(privateKey.slice(2), false))
// const address = publicKeyToAddress(publicKey)
console.log("publicKey", publicKey)
console.log("address", address)
const account = toAccount({
  address: address,
  async signMessage({ message }) {
    const messageString = message as Hex
    console.log("signMessageeee")
    const sign = await signMessageWithSilentWallet(messageString)
    const signature =  sign; // Await the signMessage function call to get the actual signature value
    const check = await verifyMessage({
      address: address,
      message: messageString,
      signature: signature // Use the awaited signature value
    })
    console.log("firstCheck", check)
    return signature
  },
  async signTransaction(transaction) {
    console.log("transaction", transaction)
    return signTransaction({ privateKey, transaction })
  },
  async signTypedData(typedData) {
    console.log("signTypedData", typedData)
    return signTypedData({ ...typedData, privateKey })
  },
})
console.log("account",account)
return {

  signMessage: account.signMessage,
  publicKey,
  source: 'privateKey',
} as PrivateKeyAccount
 
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http()
})
}


