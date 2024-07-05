import { parseGwei, verifyMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
// import { silentWalletToAccount } from '../silentWallet'
 import { createViemAccount} from "../viemSigner"
 import {createAccount} from '../basicWallet'

import { generateSilentWallet } from '../silentWallet'
import {signMessageWithSilentWallet} from '../silentWallet'
async function main(){
  const signer =  createAccount("0x92ff03f3b5675403fdf9272c96315360c38d84c1e0ce76a8d3fdf4d2549f4d24");
  const message= {
    raw: '0x138971823172983'
  }
  const signature = await createAccount(`0x${message.raw}`)
  
  const check = await verifyMessage({
    address: (await signer).address,
    message: message.raw,
    signature: `0x${signature}`
  })
  console.log("check",check)
  
}
  
  main();