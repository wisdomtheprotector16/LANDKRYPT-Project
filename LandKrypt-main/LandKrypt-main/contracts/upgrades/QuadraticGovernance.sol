// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
// Note: Counters is deprecated in OpenZeppelin v5, using manual counter instead
import "./AccessControlUpgrade.sol";

/**
 * @title QuadraticGovernance
 * @dev Advanced governance with quadratic voting, delegation, and multi-asset voting power
 * Implements quadratic voting to reduce whale influence and increase democratic participation
 */
contract QuadraticGovernance is AccessControlUpgrade {
    using Math for uint256;

    uint256 private _proposalIdCounter;

    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        uint256 id;
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
        string description;
        bytes32 descriptionHash;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 eta; // Execution time for timelock
    }

    struct Receipt {
        bool hasVoted;
        uint8 support;
        uint256 votes;
        uint256 weight; // Quadratic weight
    }

    struct VotingPower {
        uint256 tokenBalance;
        uint256 nftCount;
        uint256 stakedAmount;
        uint256 delegatedPower;
        uint256 tierMultiplier;
    }

    // Storage
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;
    mapping(address => address) public delegates;
    mapping(address => mapping(uint256 => uint256)) public checkpoints;
    mapping(address => uint256) public numCheckpoints;

    // Voting configuration
    IERC20 public governanceToken;
    IERC721 public governanceNFT;
    address public stakingContract;
    address public tierContract;

    uint256 public votingDelay = 1 days; // Delay before voting starts
    uint256 public votingPeriod = 7 days; // Voting duration
    uint256 public proposalThreshold = 100000e18; // Min tokens to propose
    uint256 public quorumNumerator = 4; // 4% quorum
    uint256 public timelock = 2 days; // Execution delay

    // Quadratic voting parameters
    uint256 public constant QUADRATIC_SCALING = 1e18;
    uint256 public maxVotingPower = 1000000e18; // Cap on voting power

    // Voting power weights
    uint256 public tokenWeight = 100; // Weight per token (basis points)
    uint256 public nftWeight = 10000; // Weight per NFT (basis points)
    uint256 public stakingWeight = 150; // Weight per staked token (basis points)

    // Events
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );

    event VoteCast(
        address indexed voter,
        uint256 proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );

    event ProposalCanceled(uint256 proposalId);
    event ProposalExecuted(uint256 proposalId);
    event DelegateChanged(
        address indexed delegator,
        address indexed fromDelegate,
        address indexed toDelegate
    );
    event DelegateVotesChanged(
        address indexed delegate,
        uint256 previousBalance,
        uint256 newBalance
    );

    constructor(
        IERC20 _governanceToken,
        IERC721 _governanceNFT,
        address _stakingContract,
        address _tierContract
    ) {
        governanceToken = _governanceToken;
        governanceNFT = _governanceNFT;
        stakingContract = _stakingContract;
        tierContract = _tierContract;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Create a new proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256) {
        require(
            getVotingPower(msg.sender, block.number - 1).tokenBalance >=
                proposalThreshold,
            "Proposer votes below proposal threshold"
        );

        require(targets.length == values.length, "Invalid proposal length");
        require(targets.length == calldatas.length, "Invalid proposal length");
        require(targets.length > 0, "Must provide actions");

        uint256 proposalId = _proposalIdCounter;
        _proposalIdCounter++;

        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            canceled: false,
            executed: false,
            description: description,
            descriptionHash: keccak256(bytes(description)),
            targets: targets,
            values: values,
            calldatas: calldatas,
            eta: 0
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            new string[](targets.length),
            calldatas,
            startBlock,
            endBlock,
            description
        );

        return proposalId;
    }

    /**
     * @dev Cast vote with quadratic voting
     */
    function castVote(
        uint256 proposalId,
        uint8 support
    ) external returns (uint256) {
        return _castVote(proposalId, msg.sender, support, "");
    }

    /**
     * @dev Cast vote with reason
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) external returns (uint256) {
        return _castVote(proposalId, msg.sender, support, reason);
    }

    /**
     * @dev Cast vote by signature
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("LandKrypt Governance")),
                block.chainid,
                address(this)
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Ballot(uint256 proposalId,uint8 support)"),
                proposalId,
                support
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        address voter = ecrecover(digest, v, r, s);
        require(voter != address(0), "Invalid signature");

        return _castVote(proposalId, voter, support, "");
    }

    /**
     * @dev Internal vote casting with quadratic calculation
     */
    function _castVote(
        uint256 proposalId,
        address voter,
        uint8 support,
        string memory reason
    ) internal returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        require(support <= 2, "Invalid vote type");

        Receipt storage receipt = receipts[proposalId][voter];
        require(!receipt.hasVoted, "Voter already voted");

        VotingPower memory power = getVotingPower(
            voter,
            proposals[proposalId].startBlock
        );
        uint256 quadraticWeight = calculateQuadraticWeight(power);

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes =
            power.tokenBalance +
            power.nftCount +
            power.stakedAmount +
            power.delegatedPower;
        receipt.weight = quadraticWeight;

        if (support == uint8(VoteType.Against)) {
            proposals[proposalId].againstVotes += quadraticWeight;
        } else if (support == uint8(VoteType.For)) {
            proposals[proposalId].forVotes += quadraticWeight;
        } else {
            proposals[proposalId].abstainVotes += quadraticWeight;
        }

        emit VoteCast(voter, proposalId, support, quadraticWeight, reason);
        return quadraticWeight;
    }

    /**
     * @dev Calculate quadratic voting weight
     */
    function calculateQuadraticWeight(
        VotingPower memory power
    ) public pure returns (uint256) {
        // Calculate total voting power
        uint256 totalPower = power.tokenBalance +
            power.nftCount +
            power.stakedAmount +
            power.delegatedPower;

        // Apply tier multiplier
        totalPower = (totalPower * (10000 + power.tierMultiplier)) / 10000;

        // Apply quadratic scaling: weight = sqrt(power)
        uint256 quadraticWeight = Math.sqrt(totalPower * QUADRATIC_SCALING);

        return quadraticWeight;
    }

    /**
     * @dev Get voting power for an account at a specific block
     */
    function getVotingPower(
        address account,
        uint256 blockNumber
    ) public view returns (VotingPower memory) {
        VotingPower memory power;

        // Token balance
        power.tokenBalance = _getTokenBalanceAt(account, blockNumber);

        // NFT count
        power.nftCount = governanceNFT.balanceOf(account) * nftWeight;

        // Staked amount (simplified - would need actual staking contract integration)
        power.stakedAmount = _getStakedAmountAt(account, blockNumber);

        // Delegated power
        power.delegatedPower = _getDelegatedPowerAt(account, blockNumber);

        // Tier multiplier (simplified - would need actual tier contract integration)
        power.tierMultiplier = _getTierMultiplier(account);

        return power;
    }

    /**
     * @dev Delegate voting power to another address
     */
    function delegate(address delegatee) external {
        address currentDelegate = delegates[msg.sender];
        uint256 delegatorBalance = governanceToken.balanceOf(msg.sender);

        delegates[msg.sender] = delegatee;

        emit DelegateChanged(msg.sender, currentDelegate, delegatee);

        _moveDelegates(currentDelegate, delegatee, delegatorBalance);
    }

    /**
     * @dev Move delegate votes from one delegate to another
     */
    function _moveDelegates(
        address srcRep,
        address dstRep,
        uint256 amount
    ) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                uint256 srcRepNum = numCheckpoints[srcRep];
                uint256 srcRepOld = srcRepNum > 0
                    ? checkpoints[srcRep][srcRepNum - 1]
                    : 0;
                uint256 srcRepNew = srcRepOld - amount;
                _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
            }

            if (dstRep != address(0)) {
                uint256 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0
                    ? checkpoints[dstRep][dstRepNum - 1]
                    : 0;
                uint256 dstRepNew = dstRepOld + amount;
                _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
            }
        }
    }

    /**
     * @dev Write checkpoint for delegate votes
     */
    function _writeCheckpoint(
        address delegatee,
        uint256 nCheckpoints,
        uint256 oldWeight,
        uint256 newWeight
    ) internal {
        if (
            nCheckpoints > 0 &&
            checkpoints[delegatee][nCheckpoints - 1] == oldWeight
        ) {
            checkpoints[delegatee][nCheckpoints - 1] = newWeight;
        } else {
            checkpoints[delegatee][nCheckpoints] = newWeight;
            numCheckpoints[delegatee] = nCheckpoints + 1;
        }

        emit DelegateVotesChanged(delegatee, oldWeight, newWeight);
    }

    /**
     * @dev Get proposal state
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (
            proposal.forVotes <= proposal.againstVotes ||
            proposal.forVotes < quorum(proposal.endBlock)
        ) {
            return ProposalState.Defeated;
        } else if (proposal.eta == 0) {
            return ProposalState.Succeeded;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.timestamp >= proposal.eta + timelock) {
            return ProposalState.Expired;
        } else {
            return ProposalState.Queued;
        }
    }

    /**
     * @dev Calculate quorum for a given block
     */
    function quorum(uint256 blockNumber) public view returns (uint256) {
        uint256 totalSupply = governanceToken.totalSupply();
        return (totalSupply * quorumNumerator) / 100;
    }

    /**
     * @dev Queue proposal for execution
     */
    function queue(uint256 proposalId) external {
        require(
            state(proposalId) == ProposalState.Succeeded,
            "Proposal cannot be queued"
        );
        proposals[proposalId].eta = block.timestamp + timelock;
    }

    /**
     * @dev Execute proposal
     */
    function execute(uint256 proposalId) external payable {
        require(
            state(proposalId) == ProposalState.Queued,
            "Proposal cannot be executed"
        );

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{
                value: proposal.values[i]
            }(proposal.calldatas[i]);
            require(success, "Transaction execution reverted");
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel proposal
     */
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer ||
                getVotingPower(proposal.proposer, block.number - 1)
                    .tokenBalance <
                proposalThreshold,
            "Cannot cancel"
        );

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // Helper functions (simplified implementations)
    function _getTokenBalanceAt(
        address account,
        uint256 blockNumber
    ) internal view returns (uint256) {
        // Simplified - would need actual historical balance tracking
        return governanceToken.balanceOf(account) * tokenWeight;
    }

    function _getStakedAmountAt(
        address account,
        uint256 blockNumber
    ) internal view returns (uint256) {
        // Simplified - would need actual staking contract integration
        return 0;
    }

    function _getDelegatedPowerAt(
        address account,
        uint256 blockNumber
    ) internal view returns (uint256) {
        // Simplified - would need actual delegation tracking
        return 0;
    }

    function _getTierMultiplier(
        address account
    ) internal view returns (uint256) {
        // Simplified - would need actual tier contract integration
        return 0;
    }

    // Admin functions
    function setVotingDelay(
        uint256 newVotingDelay
    ) external onlyRole(ADMIN_ROLE) {
        votingDelay = newVotingDelay;
    }

    function setVotingPeriod(
        uint256 newVotingPeriod
    ) external onlyRole(ADMIN_ROLE) {
        votingPeriod = newVotingPeriod;
    }

    function setProposalThreshold(
        uint256 newProposalThreshold
    ) external onlyRole(ADMIN_ROLE) {
        proposalThreshold = newProposalThreshold;
    }

    function setQuorumNumerator(
        uint256 newQuorumNumerator
    ) external onlyRole(ADMIN_ROLE) {
        require(newQuorumNumerator <= 100, "Quorum too high");
        quorumNumerator = newQuorumNumerator;
    }

    function setVotingWeights(
        uint256 _tokenWeight,
        uint256 _nftWeight,
        uint256 _stakingWeight
    ) external onlyRole(ADMIN_ROLE) {
        tokenWeight = _tokenWeight;
        nftWeight = _nftWeight;
        stakingWeight = _stakingWeight;
    }
}
