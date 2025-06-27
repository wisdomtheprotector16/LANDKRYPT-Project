//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract DevelopmentContract is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    struct ContractInfo {
        address developer;
        uint256 landNFTId;
        uint256 ownershipPercentage;
        uint256 projectTimeframe; // Added: Project completion timeframe in seconds
        uint256 startDate;       // Added: When the contract was minted
    }

    // Mapping from token ID to ContractInfo
    mapping(uint256 => ContractInfo) public contractInfo;
    
    // Mapping from landNFTId to token ID
    mapping(uint256 => uint256) public landToContract;
    
    // Mapping to track if a landNFT has a development contract
    mapping(uint256 => bool) public hasDevelopmentContract;

    //Mapping to track if a ContractId exists
    mapping(uint256 => bool) public hasContractId;


    event ContractMinted(
        uint256 indexed tokenId,
        address indexed developer,
        uint256 indexed landNFTId,
        uint256 ownershipPercentage,
        uint256 projectTimeframe // Added
    );

    constructor() 
       ERC721("LandKrypt Development Contract", "LKDC")
       Ownable(msg.sender) {}

    /**
     * @dev Mints a new Development Contract NFT - only called by NFTDAO
     * @param developer The winning developer address
     * @param landNFTId The associated LandNFT ID
     * @param ownershipPercentage The ownership percentage granted
     * @param projectTimeframe The project completion timeframe in seconds
     */
    function mintDevelopmentContract(
        address developer,
        uint256 landNFTId,
        uint256 ownershipPercentage,
        uint256 projectTimeframe
    ) external onlyOwner {
        require(!hasDevelopmentContract[landNFTId], "Contract already exists for this LandNFT");
        require(ownershipPercentage <= 100, "Invalid ownership percentage");
        require(projectTimeframe > 0, "Timeframe must be positive");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _mint(developer, newTokenId);

        contractInfo[newTokenId] = ContractInfo({
            developer: developer,
            landNFTId: landNFTId,
            ownershipPercentage: ownershipPercentage,
            projectTimeframe: projectTimeframe,
            startDate: block.timestamp
        });
        hasContractId[newTokenId] = true;

        landToContract[landNFTId] = newTokenId;
        hasDevelopmentContract[landNFTId] = true;

        emit ContractMinted(newTokenId, developer, landNFTId, ownershipPercentage, projectTimeframe);
    }

    /**
     * @dev Checks if a LandNFT has a development contract
     * @param landNFTId The LandNFT ID to check
     * @return bool True if a contract exists
     */
    function isThereDevelopmentContract(uint256 landNFTId) external view returns (bool) {
        return hasDevelopmentContract[landNFTId];
    }

    function isThereContractId(uint256 contractId) public view returns (bool) {
        return hasContractId[contractId];
    }

    /**
     * @dev Returns the developer address for a specific contract ID
     * @param contractId The Development Contract ID to query
     * @return address The developer's address
     */
    function getDeveloper(uint256 contractId) external view returns (address) {
        require(isThereContractId(contractId), "Contract does not exist");
        return contractInfo[contractId].developer;
    }

    /**
     * @dev Checks if project is completed based on timeframe
     * @param contractId The Development Contract ID to check
     * @return bool True if project timeframe has elapsed
     */
    function isProjectCompleted(uint256 contractId) external view returns (bool) {
        require(isThereContractId(contractId), "Contract does not exist");
        ContractInfo memory info = contractInfo[contractId];
        return block.timestamp > info.startDate + info.projectTimeframe;
    }

    /**
     * @dev Gets the project completion deadline timestamp
     * @param contractId The Development Contract ID to check
     * @return uint256 The timestamp when project should be completed
     */
    function getProjectDeadline(uint256 contractId) external view returns (uint256) {
        require(isThereContractId(contractId), "Contract does not exist");
        ContractInfo memory info = contractInfo[contractId];
        return info.startDate + info.projectTimeframe;
    }
}