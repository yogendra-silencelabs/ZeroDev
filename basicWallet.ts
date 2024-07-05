import { Hex, PrivateKeyAccount, SignMessageReturnType, SignableMessage, createWalletClient, getAddress, http, keccak256, signatureToHex, stringToBytes, toHex, verifyMessage } from 'viem'
import {  
  signMessage, 
  signTransaction, 
  signTypedData, 
  privateKeyToAddress,
  toAccount, 
  publicKeyToAddress
} from 'viem/accounts'
import * as sdk from "./srcMpc/lib/sdk";
import  config  from "./config.json"

import * as viem from "viem";




export async function signMessageWithSilentWallet(
  message: any
): Promise<string> {
  // Prepare the message in the ERC-191 version 0x45 format
  const prefix = "\x19Ethereum Signed Message:\n" + message.length;
  const prefixedMessage = prefix + message;
  const hexMessage = viem.toHex(prefixedMessage);

  // Hash the message
  const messageDigest = viem.hashMessage(prefixedMessage);

  // Prepare data for signing
  const d = {
    hashAlg: "keccak256",
    message: hexMessage,
    messageHashHex: messageDigest,
    signMetadata: "eth_sign",
    accountId: config.keygen.distributedKey.accountId,
    keyShare: config.keygen.distributedKey.keyShareData,
  };

  console.log("sending to runSign: d = ", d);

  // Perform signing
  const signature = await sdk.runSign(
    d.hashAlg,
    d.message,
    d.messageHashHex,
    "eth_sign",
    d.accountId,
    d.keyShare
  );

  // Extract signature components
  const signBytes = Buffer.from(signature.signature, "hex");
  const r = viem.toHex(signBytes.subarray(0, 32));
  const s = viem.toHex(signBytes.subarray(32, 64));
  const recid = signature.recId;
  console.log("recoverId", recid);

  // Construct the final signature object
  const signature1: viem.Signature = {
    r,
    s,
    v: recid === 0 ? BigInt(27) : BigInt(28),
    yParity: recid,
  };

  // Serialize the signature and return it
  const signedMsg = viem.serializeSignature(signature1);
  console.log("signedMessage", signedMsg);

  return signedMsg;
}

export async function createAccount(privateKey: Hex): Promise<viem.LocalAccount> {
const publicKey ="0x048999f0cb5370ec79816c61528c2a1d904208dbca158bf50e747b961d9160611869817932f2c12979923c7f6caccc16cad01dceda7f69e4b2f7d9783877c937f4"
const address = publicKeyToAddress(publicKey)
// const publicKey = toHex(secp256k1.getPublicKey(privateKey.slice(2), false))
// const address = publicKeyToAddress(publicKey)
console.log("publicKey", publicKey)
console.log("address", address)
return toAccount({
  address: address,
  async signMessage({ message }): Promise<`0x${string}`> {
    const messageString = message as Hex
    console.log("signMessageeee")
    const sign = await signMessageWithSilentWallet(messageString)
    
    // const signature =  sign; // Await the signMessage function call to get the actual signature value
    // const check = await verifyMessage({
    //   address: address,
    //   message: messageString,
    //   signature: signature // Use the awaited signature value
    // })
    // console.log("firstCheck", check)
    return `0x${sign}`
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
// console.log("account",account)
// return {
//   ...account,
//   publicKey,
//   source: 'privateKey',
// } as PrivateKeyAccount
}

