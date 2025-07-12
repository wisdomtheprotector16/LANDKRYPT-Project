// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
// Note: Counters is deprecated in OpenZeppelin v5, using manual counter instead
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./AccessControlUpgrade.sol";

/**
 * @title GasOptimizedNFT
 * @dev Gas-optimized Real Estate NFT with EIP-2981 royalties and batch operations
 * Implements EIP-721, EIP-2981 (Royalties), EIP-165 (Interface Detection)
 */
contract GasOptimizedNFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Royalty,
    AccessControlUpgrade
{
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    // Packed struct for gas optimization
    struct PropertyData {
        uint64 price; // Price in wei (up to ~18 ETH)
        uint32 propertyType; // Property type ID
        uint32 location; // Location ID
        uint16 rarity; // Rarity level (0-65535)
        uint16 attributes; // Packed attributes bitfield
        uint64 timestamp; // Creation timestamp
    }

    // Storage optimization
    mapping(uint256 => PropertyData) private _propertyData;
    mapping(uint256 => string) private _tokenURIs;

    // Batch operations
    struct BatchMintData {
        address to;
        string uri;
        PropertyData propertyData;
        uint96 royaltyFee; // Basis points (e.g., 250 = 2.5%)
    }

    // Events
    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 price,
        uint32 propertyType,
        uint32 location,
        uint16 rarity
    );

    event BatchMinted(address indexed to, uint256[] tokenIds);
    event PropertyDataUpdated(uint256 indexed tokenId, PropertyData data);

    constructor(
        string memory name,
        string memory symbol,
        address defaultAdmin
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);

        // Set default royalty (2.5%)
        _setDefaultRoyalty(defaultAdmin, 250);
    }

    /**
     * @dev Gas-optimized minting with property data
     */
    function mint(
        address to,
        string memory uri,
        PropertyData memory propertyData,
        uint96 royaltyFee
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _propertyData[tokenId] = propertyData;

        if (royaltyFee > 0) {
            _setTokenRoyalty(tokenId, to, royaltyFee);
        }

        emit PropertyMinted(
            tokenId,
            to,
            propertyData.price,
            propertyData.propertyType,
            propertyData.location,
            propertyData.rarity
        );

        return tokenId;
    }

    /**
     * @dev Batch minting for gas efficiency
     */
    function batchMint(
        BatchMintData[] calldata mintData
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256[] memory) {
        uint256 length = mintData.length;
        require(length > 0 && length <= 50, "Invalid batch size");

        uint256[] memory tokenIds = new uint256[](length);

        for (uint256 i = 0; i < length; ) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;

            _safeMint(mintData[i].to, tokenId);
            _setTokenURI(tokenId, mintData[i].uri);
            _propertyData[tokenId] = mintData[i].propertyData;

            if (mintData[i].royaltyFee > 0) {
                _setTokenRoyalty(
                    tokenId,
                    mintData[i].to,
                    mintData[i].royaltyFee
                );
            }

            tokenIds[i] = tokenId;

            emit PropertyMinted(
                tokenId,
                mintData[i].to,
                mintData[i].propertyData.price,
                mintData[i].propertyData.propertyType,
                mintData[i].propertyData.location,
                mintData[i].propertyData.rarity
            );

            unchecked {
                ++i;
            }
        }

        emit BatchMinted(mintData[0].to, tokenIds);
        return tokenIds;
    }

    /**
     * @dev Gas-optimized batch transfer
     */
    function batchTransfer(
        address from,
        address to,
        uint256[] calldata tokenIds
    ) external {
        require(tokenIds.length <= 20, "Batch size too large");

        for (uint256 i = 0; i < tokenIds.length; ) {
            transferFrom(from, to, tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Get property data (gas optimized)
     */
    function getPropertyData(
        uint256 tokenId
    ) external view returns (PropertyData memory) {
        require(_exists(tokenId), "Token does not exist");
        return _propertyData[tokenId];
    }

    /**
     * @dev Update property data (admin only)
     */
    function updatePropertyData(
        uint256 tokenId,
        PropertyData memory newData
    ) external onlyRole(ADMIN_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        _propertyData[tokenId] = newData;
        emit PropertyDataUpdated(tokenId, newData);
    }

    /**
     * @dev Batch property data retrieval
     */
    function getBatchPropertyData(
        uint256[] calldata tokenIds
    ) external view returns (PropertyData[] memory) {
        PropertyData[] memory data = new PropertyData[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; ) {
            require(_exists(tokenIds[i]), "Token does not exist");
            data[i] = _propertyData[tokenIds[i]];
            unchecked {
                ++i;
            }
        }
        return data;
    }

    /**
     * @dev On-chain metadata generation for gas savings
     */
    function generateMetadata(
        uint256 tokenId
    ) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        PropertyData memory data = _propertyData[tokenId];

        string memory json = string(
            abi.encodePacked(
                '{"name": "LandKrypt Property #',
                tokenId.toString(),
                '", "description": "Real Estate NFT on LandKrypt", "attributes": [',
                '{"trait_type": "Property Type", "value": "',
                data.propertyType.toString(),
                '"}, {"trait_type": "Location", "value": "',
                data.location.toString(),
                '"}, {"trait_type": "Rarity", "value": "',
                data.rarity.toString(),
                '"}, {"trait_type": "Price", "value": "',
                data.price.toString(),
                '"}]}'
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    /**
     * @dev Enhanced royalty management
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyRole(ADMIN_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) external onlyRole(ADMIN_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @dev Efficient token existence check
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @dev Get tokens owned by address (paginated for gas efficiency)
     */
    function tokensOfOwner(
        address owner,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        require(offset < balance, "Offset out of bounds");

        uint256 length = limit;
        if (offset + limit > balance) {
            length = balance - offset;
        }

        uint256[] memory tokens = new uint256[](length);
        for (uint256 i = 0; i < length; ) {
            tokens[i] = tokenOfOwnerByIndex(owner, offset + i);
            unchecked {
                ++i;
            }
        }

        return tokens;
    }

    /**
     * @dev Emergency functions
     */
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }

    function emergencyTokenTransfer(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) {
        IERC20(token).transfer(to, amount);
    }

    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
        delete _propertyData[tokenId];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721Royalty, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
