import { ethers } from "ethers";

const ABI = [
  "event ProofHashAdded(bytes32 proofHash)",
  "event RandomnessConsumed(address indexed user, uint256 random)",
  "function addProofHash(bytes32 proofHash) external",
  "function getRandomNumber() external payable returns (uint256)",
];

export type ClientOptions = {
  rpcUrl?: string;
  privateKey?: string;
  contractAddress: string;
};

export class RandomnessContractClient {
  provider: ethers.providers.JsonRpcProvider;
  signer: ethers.Wallet;
  contract: ethers.Contract;
  iface: ethers.utils.Interface;

  constructor(opts: ClientOptions) {
    const rpc = opts.rpcUrl || process.env.RPC_URL || "http://127.0.0.1:8545";
    const pk = opts.privateKey || process.env.SERVER_PRIVATE_KEY || "";
    if (!opts.contractAddress) throw new Error("contractAddress required");

    this.provider = new ethers.providers.JsonRpcProvider(rpc);
    this.signer = new ethers.Wallet(pk, this.provider);
    this.contract = new ethers.Contract(opts.contractAddress, ABI, this.signer);
    this.iface = new ethers.utils.Interface(ABI);
  }

  async addProofHash(proofHash: string) {
    // Accept either 0x-prefixed or plain hex
    const hash = proofHash.startsWith("0x") ? proofHash : `0x${proofHash}`;
    const tx = await this.contract.addProofHash(hash);
    const receipt = await tx.wait();
    return { txHash: receipt.transactionHash, receipt };
  }

  async getRandomNumber() {
    const fee = ethers.utils.parseEther("0.001"); // matches contract FEE
    const tx = await this.contract.getRandomNumber({ value: fee });
    const receipt = await tx.wait();

    // Try to decode RandomnessConsumed event from logs
    const topic = this.iface.getEventTopic("RandomnessConsumed");
    const log = receipt.logs.find((l: any) => l.topics[0] === topic);
    if (log) {
      const parsed = this.iface.parseLog(log);
      return {
        txHash: receipt.transactionHash,
        random: parsed.args.random.toString(),
        user: parsed.args.user,
        receipt,
      };
    }

    return { txHash: receipt.transactionHash, receipt };
  }
}

export default RandomnessContractClient;