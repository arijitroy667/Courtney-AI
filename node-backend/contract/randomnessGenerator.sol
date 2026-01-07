// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract RandomnessGenerator {
    bytes32 public globalSeed;
    bytes32[] public proofHashes;

    uint256 private requestCount;

    uint256 public constant FEE = 0.001 ether;

    event ProofHashAdded(bytes32 proofHash);
    event RandomnessConsumed(address indexed user, uint256 random);

    /* ========== ZK PROOF INGESTION ========== */

    function addProofHash(bytes32 proofHash) external {
        
        proofHashes.push(proofHash);

        globalSeed = keccak256(
            abi.encodePacked(
                globalSeed,
                proofHash,
                block.prevrandao
            )
        );

        emit ProofHashAdded(proofHash);
    }

    /* ========== USER RANDOMNESS API ========== */

    function getRandomNumber() external payable returns (uint256 random) {
        require(msg.value == FEE, "Fee: 0.001 ETH required");
        require(globalSeed != bytes32(0), "Entropy not initialized");

        unchecked {
            requestCount++;
        }

        random = uint256(
            keccak256(
                abi.encodePacked(
                    globalSeed,
                    block.prevrandao,
                    requestCount,
                    msg.sender // optional personalization
                )
            )
        );

        emit RandomnessConsumed(msg.sender, random);
    }
}
