import "dotenv/config"
import {
  createKernelAccount,
  createZeroDevPaymasterClient,
  createKernelAccountClient,
} from "@zerodev/sdk"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from "permissionless"
import { http, Hex, createPublicClient, zeroAddress, LocalAccount, verifyMessage } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import { smartAccountSigner } from "../pimlico"
// import {createViemAccount1} from "../walletClient"
if (
  !process.env.BUNDLER_RPC ||
  !process.env.PAYMASTER_RPC ||
  !process.env.PRIVATE_KEY
) {
  throw new Error("BUNDLER_RPC or PAYMASTER_RPC or PRIVATE_KEY is not set")
}

export const publicClient = createPublicClient({
	transport: http("https://rpc.ankr.com/eth_sepolia"),
})

const chain = sepolia
const entryPoint = ENTRYPOINT_ADDRESS_V07
import { generatePrivateKey } from 'viem/accounts'
import { signerToEcdsaKernelSmartAccount } from "permissionless/accounts"
 
const privateKey = generatePrivateKey()

async function testSigner(signer: LocalAccount) {
  const message = { raw: "0x123" };
  const messageString = `${message.raw}` as Hex;
  const signature = await signer.signMessage({ message: messageString });
  console.log("verify message props OUTSIDE", signer.address, message, signature)
  const verified = await verifyMessage({ message: messageString, signature, address: signer.address });
  console.log("verified test signature? ", verified);
}
const main = async () => {

  const signer =  await smartAccountSigner
  console.log("signer",signer)
  // const signer = privateKeyToAccount(privateKey)

  // testSigner(signer);

  // const publicKeyFromPrivateKey = signer2.publicKey
  // const addressFromPrivateKey = signer2.address
  // console.log("publicKeyFromPrivateKey", publicKeyFromPrivateKey)
  // console.log("addressFromPrivateKey", addressFromPrivateKey)

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: smartAccountSigner,
    entryPoint,
  });

  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
  });
  console.log("My account:", account.address);

  const kernelClient1 = await signerToEcdsaKernelSmartAccount(publicClient, {
    signer,
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // v0.6 entrypoint
  });

  const kernelClient = createKernelAccountClient({
    account: account,
    entryPoint,
    chain,
    bundlerTransport: http(process.env.BUNDLER_RPC),
    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        const paymasterClient = createZeroDevPaymasterClient({
          chain,
          transport: http(process.env.PAYMASTER_RPC),
          entryPoint,
        })
        return paymasterClient.sponsorUserOperation({
          userOperation,
          entryPoint,
        })
      },
    },
  })

  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await account.encodeCallData({
        to: zeroAddress,
        value: BigInt(0),
        data: "0x",
      }),
    },
  })

  console.log("userOp hash:", userOpHash)

  const bundlerClient = kernelClient.extend(bundlerActions(entryPoint))
  const _receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  })

  console.log("userOp completed")
}

main()
