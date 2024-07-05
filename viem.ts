import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hexToBytes, bytesToHex } from 'viem/utils';

const privateKey = '0xYOUR_PRIVATE_KEY_HERE';
const account = privateKeyToAccount(privateKey);

async function customSignMessage(message: string): Promise<string> {
  try {
    // Dynamically import the noble secp256k1 module
    const { signAsync } = await import('@noble/secp256k1');

    // Convert the message to bytes
    const messageBytes = new TextEncoder().encode(message);

    // Hash the message (customizable)
    const messageHash = await crypto.subtle.digest('SHA-256', messageBytes);
    const messageHashBytes = new Uint8Array(messageHash);

    // Sign the message hash using the private key
    const signature = signAsync(messageHashBytes, privateKey as Hex);

    // Return the signature in hex format
    return signature.toString();
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
}

(async () => {
  const message = 'Hello, viem!';

  try {
    const signature = await customSignMessage(message);
    console.log('Signature:', signature);
  } catch (error) {
    console.error('Error:', error);
  }
})();
