import "dotenv/config";
import { zeroAddress } from "viem";
import { getKernelClient } from "../utils";
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from "permissionless";
import { createViemAccount } from "../viemSigner";
const entryPoint = ENTRYPOINT_ADDRESS_V07;

async function main() {

  const kernelClient = await getKernelClient(entryPoint);

  console.log("Account address:", kernelClient.account.address);

  const account = createViemAccount("0x92ff03f3b5675403fdf9272c96315360c38d84c1e0ce76a8d3fdf4d2549f4d24");
  console.log("Account address:", account.address);
  
  
  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await kernelClient.account.encodeCallData({
        to: zeroAddress,
        value: BigInt(0),
        data: "0x",
      }),
    },
  });
  
  console.log("UserOp hash:", userOpHash);
  console.log("Waiting for UserOp to complete...");

  const bundlerClient = kernelClient.extend(bundlerActions(entryPoint));
  await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  console.log("UserOp completed");
}

main();
