import * as viem from "viem";
import { publicKeyToAddress, signTransaction, toAccount } from "viem/accounts";
import * as sdk from "./srcMpc/lib/sdk";
import path from "path";
import fs, { promises } from "fs";
import prettier from "prettier";
import { Wallet, ethers } from "ethers";
import { sign } from "crypto";
import { hexZeroPad, joinSignature, splitSignature } from "ethers/lib/utils";
import { sepolia } from "viem/chains";
/**
 * Create a new viem custom account for signing transactions using
 * the MPC network.
 * @param clusterConfig The network cluster configuration.
 * @param keyId The selected Key ID.
 * @param publicKey Associated public key of the selected Key ID.
 * @param threshold The threshold.
/** */


export async function signMessageWithSilentWallet(
  message: any
): Promise<string> {
  const hexMessage = viem.toPrefixedMessage(message);
  const messageDigest = viem.hashMessage(message);
  const d = {
    hashAlg: "keccak256",
    message: hexMessage,
    messageHashHex: messageDigest,
    signMetadata: "eth_sign",
    accountId: 1,
    keyShare:{
        "x1": "47767fe4ca14c6c0cfa4043cbbae442b0d9455b404e6bdae8379155b4a612dc9",
        "public_key": "928f221001bd83fdee38cfcf8bd5a0bf98d89168407158086f0ab54a82992702c73e048113f5fd704f050d9587fc847814e4416802c06b8424a9a4902d75ccd9",
        "paillier_private_key": {
          "p": "AQVQ1QSME6oguuU2jDEtel8PWI6n/A71LoHiol57i5vHmpIj8pn40C8UGjcRMs64UZofXoG38DDtJqz201vt9NpiZiHAGpDq5xYa6bpsk+EhfKL3b813wPILQseO6XnntvvbEFvhzGf2ltsZhhelPJQm4nFOb5opj1Xe7dBIdK2p",
          "q": "9h2ZG2hiZtj/Zy2xvXuv8lFY6aZU1+nIRFNxdaLOc2J5PDI68XhpgPMimV8W/7xMPYPzPpeKqzgLjsztLhjQyrict8uWSPJjQj4jkl5En5rr4GbTG3CiXnSkfGXb18A0iWoS0/Qt8jQNct/nu55rV8QQtrpTVZVmXgqAO09uj7M="
        },
        "paillier_public_key": "+znjI8mCO19ae+4s69sFwRm6RCYXbpInBhx/lhO+2yJf1YuLSNP+yKyuhFMcjUxyHkFs2z0vp8hztMzAWoR7JI4L2/h2fnOBxrIrnMxDjiA+kidjPmZ6f9C/cJsRkexAultisWqs5QuuuBm6xbhpm+Y4SBSb+tJ3rO/mbiIi/xX4HXKCyLDvCJqihw2+XH6GF0kLDd7gO34eyPmfmtLmIZB+6OZ2Cx8bDyOle/xY2vJifERqd+82OBVN7xug+TbqedmBtr66WrXljyoiG8cLeyvcelu9CZuq8I6/wTawOGzJ8hrH/EZNkqDqUzKwCiZ56+Q3Pn7M/0Hn5UrInDTUKw=="
      } ,
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
  // console.log("recoverId", recid);

  // const signature1: viem.Signature = {
  //   r,
  //   s,
  //   v: recid === 0 ? BigInt(27) : BigInt(28),
  // };

  // const signedMsg = viem.serializeSignature(signature1);
  // console.log("signedMessage", signedMsg);

  const split = splitSignature({
    recoveryParam: recid,
    r: hexZeroPad(`${r.toString()}`, 32),
    s: hexZeroPad(`${s.toString()}`, 32),
  });

  const signedMsg = joinSignature(split) as viem.Hex;
  console.log("signedMsg", signedMsg);
  return signedMsg;
}

async function signMessageWithPrivateKey(
  message: string,
  privateKey: string
): Promise<viem.Hex> {
  const wallet = new Wallet(privateKey);
  // Sign the message
  const signature = await wallet.signMessage(message);
  console.log("signature from signMessageWithPrivateKey", signature);
  return signature as viem.Hex;
}



export async function createViemAccount() {


const address = "0x6Af7dC0C6c0338c731ad2cF535cB8D992c57Ee00"

return {
    address : "0x6Af7dC0C6c0338c731ad2cF535cB8D992c57Ee00",
    source: "custom",
    type: "local",
    publicKey:"0x04928f221001bd83fdee38cfcf8bd5a0bf98d89168407158086f0ab54a82992702c73e048113f5fd704f050d9587fc847814e4416802c06b8424a9a4902d75ccd9" || "0x",
    async signMessage({ message }: {message: viem.SignableMessage}): Promise<`0x${string}`>{
    //   const sign = await signMessageWithSilentWallet(message);
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
      const sign = await signMessageWithSilentWallet(messageString);
      console.log("verify message props INSIDE", address, messageString, sign);
      let messageCheck = await viem.verifyMessage({ message: messageString, signature:`0x${sign.slice(2)}`, address: address });
      console.log("messageCheck", messageCheck);
      return `0x${sign.slice(2)}`;
    },
    async signTransaction(transaction) {
      const sign = await signMessageWithSilentWallet(transaction);
      return `0x${sign.slice(2)}`;
    },
    async signTypedData(typedData) {
      const sign = await signMessageWithSilentWallet(typedData);
      return `0x${sign.slice(2)}`;
    },
    
  };

}

export async function createViemAccount1() {
  const account = await createViemAccount();
  const walletClient = viem.createWalletClient({
    account,
    chain: sepolia,
  });
  return walletClient;
}


