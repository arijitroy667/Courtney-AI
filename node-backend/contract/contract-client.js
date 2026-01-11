import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { monadTestnet } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";
import "dotenv/config";

const client = createThirdwebClient({
  secretKey: process.env.SECRET_KEY,
});

const contract = getContract({
  client,
  chain: monadTestnet,
  address: process.env.RNG_CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE",
});

const account = privateKeyToAccount({
  client,
  privateKey: process.env.SERVER_PRIVATE_KEY,
});

export async function addProofHashToContract(proofHash) {
  try {
    const transaction = prepareContractCall({
      contract,
      method: "function addProofHash(bytes32 proofHash)",
      params: [proofHash],
    });

    const { transactionHash } = await sendTransaction({
      transaction,
      account,
    });

    return transactionHash;
  } catch (error) {
    console.error("Contract interaction error:", error);
    throw error;
  }
}

export async function getRandomNumber() {
  try {
    const transaction = prepareContractCall({
      contract,
      method: "function getRandomNumber() payable returns (uint256)",
      params: [],
      value: BigInt(1000000000000000), // 0.001 MON in wei
    });

    const { transactionHash } = await sendTransaction({
      transaction,
      account,
    });

    return transactionHash;
  } catch (error) {
    console.error("Get random number error:", error);
    throw error;
  }
}
