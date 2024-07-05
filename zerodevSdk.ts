import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { KERNEL_V3_1 } from "@zerodev/sdk/constants"
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless';
import { privateKeyToAccount } from "viem/accounts"
import { Hex } from "viem"
 
// Create a signer
const smartAccountSigner = privateKeyToAccount(process.env.PRIVATE_KEY as Hex)
 
const publicClient = createPublicClient({
  transport: http('https://rpc-amoy.polygon.technology'),
})
 
// Pass your `smartAccountSigner` to the validator
const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
  signer: smartAccountSigner,
  entryPoint: ENTRYPOINT_ADDRESS_V07,
  kernelVersion: KERNEL_V3_1
})
 
// You can now use this ECDSA Validator to create a Kernel account