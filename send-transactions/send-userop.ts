import "dotenv/config";
import { Hex, http, zeroAddress } from "viem";
import { getKernelClient } from "../utils";
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from "permissionless";
import { createViemAccount } from "../walletClient";
import { createWalletClient } from "viem";
import { sepolia } from "viem/chains";
import { sendUserOperation } from "viem";
const entryPoint = ENTRYPOINT_ADDRESS_V07;

async function main() {

  const kernelClient = await getKernelClient(entryPoint);

  console.log("Account address:", kernelClient.account.address);
  const privateKey = process.env.PRIVATE_KEY as Hex;
  const account = await createViemAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http("https://rpc.ankr.com/eth_sepolia"),
  });

  console.log("Account address:", account.address);

  const userOpHash = await walletClient.sendUserOperation({
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
