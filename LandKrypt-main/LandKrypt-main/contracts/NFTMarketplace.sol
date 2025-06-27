//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RealEstateNFT.sol";
import "./LandKryptStableCoin.sol";
import "./NFTDAO.sol"; // Import NFTDAO to call recordNFTPurchaseTime
import "./StakingFactory.sol";

import "./INFTStaking.sol";

contract NFTMarketplace {
    RealEstateNFT public nftContract;
    LandKryptStablecoin public stablecoin;
    address public owner;
    NFTDAO public nftDAO; // Reference to the NFTDAO contract

    struct Listing {
        uint256 price;
        address stakingContract;
        bool isListed;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public earnings;
    mapping(uint256 => bool) public listedBool;
    mapping(uint256 => uint256) public originalPrices;
    mapping(uint256 => address) public tokenIdToOwner;

    event NFTListed(uint256 tokenId, uint256 price, address stakingContract);
    event NFTPurchased(uint256 tokenId, address buyer);
    event EarningsWithdrawn(uint256 tokenId, uint256 amount);
    event StablecoinMinted(uint256 tokenId, uint256 amount);
    event StablecoinBurned(uint256 tokenId, uint256 amount);

    constructor(address _nftContract, address _stablecoin, address _nftDAO) {
        nftContract = RealEstateNFT(_nftContract);
        stablecoin = LandKryptStablecoin(_stablecoin);
        owner = msg.sender;
        nftDAO = NFTDAO(_nftDAO); // Initialize NFTDAO
        
    }
    

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    function changeDAOAddress(address _newDAO) external {
       require(msg.sender == owner, "Only owner can call this function");
       nftDAO =  NFTDAO(_newDAO);  
    }

    // List an NFT, mint stablecoins, and assign a staking contract
    function listNFT(uint256 tokenId, uint256 price, address stakingContract, address nftOwner) external {
        require(INFTStaking(stakingContract).returnTokenId() == uint256(tokenId), "Staking contract must have been deployed for this ID");
        require(!listedBool[tokenId], "NFT is already listed");

        listings[tokenId] = Listing(price, stakingContract, true);
        tokenIdToOwner[tokenId] = nftOwner;

        // Mint stablecoins at 135% of the NFT price
        uint256 stablecoinAmount = (price * 135) / 100;
        stablecoin.mint(stakingContract, stablecoinAmount); //@dev stablecoin minted to staking contract instance
        listedBool[tokenId] = true;

        emit NFTListed(tokenId, price, stakingContract);
        emit StablecoinMinted(tokenId, stablecoinAmount);
    }

    // Only the assigned staking contract can buy the NFT
    
    function buyNFT(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.isListed, "NFT is not listed");
        require(msg.sender == listing.stakingContract, "Only assigned staking contract can buy");

        // Store original price before deleting listing
        originalPrices[tokenId] = listing.price;

        // Transfer NFT and record purchase as before
        nftContract.transferFrom(nftContract.ownerOf(tokenId), listing.stakingContract, tokenId);
        earnings[tokenId] += listing.price;
        
        // Record both purchase time AND original price in NFTDAO
        nftDAO.recordNFTPurchase(tokenId, listing.price);

        delete listings[tokenId];
        emit NFTPurchased(tokenId, msg.sender);
    }


    // Withdraw earnings from a sold NFT
    function withdrawEarnings(uint256 tokenId) external {
        require(tokenIdToOwner[tokenId] == msg.sender, "Only owner can withdraw");
        uint256 amount = earnings[tokenId];
        require(amount > 0, "No earnings to withdraw");

        earnings[tokenId] = 0;
        payable(msg.sender).transfer(amount);
        emit EarningsWithdrawn(tokenId, amount);
    }

    // Delete a listing (only owner)
    function deleteListing(uint256 tokenId) external {
        require(listings[tokenId].isListed, "NFT is not listed");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Only owner can delete listing");

        // Burn stablecoins at 135% of the NFT price
        uint256 stablecoinAmount = (listings[tokenId].price * 135) / 100;
        stablecoin.burn(address(this), stablecoinAmount);

        delete listings[tokenId];
        emit StablecoinBurned(tokenId, stablecoinAmount);//@dev should return everyones stakes to them
    }
    // Add view function to get original price
    function getOriginalPrice(uint256 tokenId) external view returns (uint256) {
        return originalPrices[tokenId];
    }

}