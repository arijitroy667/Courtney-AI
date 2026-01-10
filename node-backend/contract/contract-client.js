import {
  JsonRpcProvider,
  Wallet,
  Contract,
  Interface,
  parseEther,
} from "ethers";

const ABI = [
  "event ProofHashAdded(bytes32 proofHash)",
  "event RandomnessConsumed(address indexed user, uint256 random)",
  "function addProofHash(bytes32 proofHash) external",
  "function getRandomNumber() external payable returns (uint256)",
];

/**
 * @typedef {Object} ClientOptions
 * @property {string} [rpcUrl]
 * @property {string} [privateKey]
 * @property {string} contractAddress
 */

export class RandomnessContractClient {
  provider;
  signer;
  contract;
  iface;

  constructor(opts) {
    const rpc = opts.rpcUrl || process.env.RPC_URL || "http://127.0.0.1:8545";
    const pk = opts.privateKey || process.env.SERVER_PRIVATE_KEY || "";
    if (!opts.contractAddress) throw new Error("contractAddress required");

    this.provider = new JsonRpcProvider(rpc);
    this.signer = new Wallet(pk, this.provider);
    this.contract = new Contract(opts.contractAddress, ABI, this.signer);
    this.iface = new Interface(ABI);
  }

  async addProofHash(proofHash) {
    // Accept either 0x-prefixed or plain hex
    const hash = proofHash.startsWith("0x") ? proofHash : `0x${proofHash}`;
    const tx = await this.contract.addProofHash(hash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }

  async getRandomNumber() {
    const fee = parseEther("0.001"); // matches contract FEE
    const tx = await this.contract.getRandomNumber({ value: fee });
    const receipt = await tx.wait();

    // Try to decode RandomnessConsumed event from logs
    const topic = this.iface.getEventTopic("RandomnessConsumed");
    const log = receipt.logs.find((l) => l.topics[0] === topic);
    if (log) {
      const parsed = this.iface.parseLog(log);
      return {
        txHash: receipt.hash,
        random: parsed.args.random.toString(),
        user: parsed.args.user,
        receipt,
      };
    }

    return { txHash: receipt.hash, receipt };
  }
}

export default RandomnessContractClient;
