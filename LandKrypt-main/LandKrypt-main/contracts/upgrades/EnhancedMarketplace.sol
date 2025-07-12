// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// Note: Counters is deprecated in OpenZeppelin v5, using manual counters instead
import "./AccessControlUpgrade.sol";

/**
 * @title EnhancedMarketplace
 * @dev Advanced NFT marketplace with auctions, offers, and royalty support
 * Implements EIP-2981 royalty standard and gas-optimized operations
 */
contract EnhancedMarketplace is AccessControlUpgrade, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private _listingIdCounter;
    uint256 private _auctionIdCounter;
    uint256 private _offerIdCounter;

    // Listing types
    enum ListingType {
        FIXED_PRICE,
        DUTCH_AUCTION,
        ENGLISH_AUCTION
    }
    enum ListingStatus {
        ACTIVE,
        SOLD,
        CANCELLED,
        EXPIRED
    }

    // Packed structs for gas optimization
    struct Listing {
        uint128 price;
        uint64 startTime;
        uint64 endTime;
        address seller;
        address buyer;
        ListingType listingType;
        ListingStatus status;
    }

    struct DutchAuction {
        uint128 startPrice;
        uint128 endPrice;
        uint64 duration;
        uint64 startTime;
    }

    struct EnglishAuction {
        uint128 reservePrice;
        uint128 currentBid;
        uint64 duration;
        uint64 startTime;
        address highestBidder;
        bool extended;
    }

    struct Offer {
        uint128 amount;
        uint64 expiry;
        address offerer;
        address currency;
        bool active;
    }

    // Storage
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => DutchAuction) public dutchAuctions;
    mapping(uint256 => EnglishAuction) public englishAuctions;
    mapping(uint256 => Offer[]) public offers;
    mapping(address => mapping(uint256 => uint256)) public userOfferIndex;

    // Supported tokens and NFTs
    mapping(address => bool) public supportedTokens;
    mapping(address => bool) public supportedNFTs;

    // Fee structure
    uint256 public platformFee = 250; // 2.5% in basis points
    address public feeRecipient;
    mapping(address => uint256) public tierDiscounts; // Tier-based fee discounts

    // Constants
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    uint256 public constant AUCTION_EXTENSION_TIME = 10 minutes;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        ListingType listingType
    );

    event ListingSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price,
        uint256 platformFee,
        uint256 royaltyFee
    );

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 startPrice,
        uint256 endPrice
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event OfferMade(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed offerer,
        uint256 amount,
        uint256 expiry
    );

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Create fixed price listing
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address currency,
        uint256 duration
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(supportedNFTs[nftContract], "NFT contract not supported");
        require(supportedTokens[currency], "Currency not supported");
        require(price > 0, "Price must be greater than 0");
        require(
            duration > 0 && duration <= MAX_AUCTION_DURATION,
            "Invalid duration"
        );

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(tokenId) == address(this),
            "Not approved"
        );

        uint256 listingId = _listingIdCounter;
        _listingIdCounter++;

        listings[listingId] = Listing({
            price: uint128(price),
            startTime: uint64(block.timestamp),
            endTime: uint64(block.timestamp + duration),
            seller: msg.sender,
            buyer: address(0),
            listingType: ListingType.FIXED_PRICE,
            status: ListingStatus.ACTIVE
        });

        emit ListingCreated(
            listingId,
            nftContract,
            tokenId,
            msg.sender,
            price,
            ListingType.FIXED_PRICE
        );
        return listingId;
    }

    /**
     * @dev Create Dutch auction
     */
    function createDutchAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(supportedNFTs[nftContract], "NFT contract not supported");
        require(
            startPrice > endPrice,
            "Start price must be higher than end price"
        );
        require(endPrice > 0, "End price must be greater than 0");
        require(
            duration >= MIN_AUCTION_DURATION &&
                duration <= MAX_AUCTION_DURATION,
            "Invalid duration"
        );

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(tokenId) == address(this),
            "Not approved"
        );

        uint256 auctionId = _auctionIdCounter;
        _auctionIdCounter++;

        dutchAuctions[auctionId] = DutchAuction({
            startPrice: uint128(startPrice),
            endPrice: uint128(endPrice),
            duration: uint64(duration),
            startTime: uint64(block.timestamp)
        });

        listings[auctionId] = Listing({
            price: uint128(startPrice),
            startTime: uint64(block.timestamp),
            endTime: uint64(block.timestamp + duration),
            seller: msg.sender,
            buyer: address(0),
            listingType: ListingType.DUTCH_AUCTION,
            status: ListingStatus.ACTIVE
        });

        emit AuctionCreated(
            auctionId,
            nftContract,
            tokenId,
            msg.sender,
            startPrice,
            endPrice
        );
        return auctionId;
    }

    /**
     * @dev Get current Dutch auction price
     */
    function getCurrentDutchPrice(
        uint256 auctionId
    ) public view returns (uint256) {
        DutchAuction memory auction = dutchAuctions[auctionId];
        Listing memory listing = listings[auctionId];

        if (block.timestamp >= listing.endTime) {
            return auction.endPrice;
        }

        uint256 elapsed = block.timestamp - auction.startTime;
        uint256 totalPriceDecrease = auction.startPrice - auction.endPrice;
        uint256 currentPriceDecrease = (totalPriceDecrease * elapsed) /
            auction.duration;

        return auction.startPrice - currentPriceDecrease;
    }

    /**
     * @dev Purchase from listing or Dutch auction
     */
    function purchase(
        uint256 listingId,
        address nftContract,
        uint256 tokenId,
        address currency
    ) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(block.timestamp <= listing.endTime, "Listing expired");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        uint256 price;
        if (listing.listingType == ListingType.DUTCH_AUCTION) {
            price = getCurrentDutchPrice(listingId);
        } else {
            price = listing.price;
        }

        // Handle payment
        _handlePayment(currency, msg.sender, price);

        // Calculate and distribute fees
        (
            uint256 platformFeeAmount,
            uint256 royaltyAmount,
            address royaltyRecipient
        ) = _calculateFees(nftContract, tokenId, price, listing.seller);

        uint256 sellerAmount = price - platformFeeAmount - royaltyAmount;

        // Transfer payments
        _transferPayment(currency, feeRecipient, platformFeeAmount);
        if (royaltyAmount > 0) {
            _transferPayment(currency, royaltyRecipient, royaltyAmount);
        }
        _transferPayment(currency, listing.seller, sellerAmount);

        // Transfer NFT
        IERC721(nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            tokenId
        );

        // Update listing
        listing.status = ListingStatus.SOLD;
        listing.buyer = msg.sender;

        emit ListingSold(
            listingId,
            msg.sender,
            price,
            platformFeeAmount,
            royaltyAmount
        );
    }

    /**
     * @dev Make offer on NFT
     */
    function makeOffer(
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        address currency,
        uint256 expiry
    ) external whenNotPaused nonReentrant {
        require(supportedNFTs[nftContract], "NFT contract not supported");
        require(supportedTokens[currency], "Currency not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(expiry > block.timestamp, "Expiry must be in future");

        // Transfer offer amount to escrow
        IERC20(currency).safeTransferFrom(msg.sender, address(this), amount);

        offers[_getOfferKey(nftContract, tokenId)].push(
            Offer({
                amount: uint128(amount),
                expiry: uint64(expiry),
                offerer: msg.sender,
                currency: currency,
                active: true
            })
        );

        emit OfferMade(nftContract, tokenId, msg.sender, amount, expiry);
    }

    /**
     * @dev Accept offer
     */
    function acceptOffer(
        address nftContract,
        uint256 tokenId,
        uint256 offerIndex
    ) external whenNotPaused nonReentrant {
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );

        uint256 offerKey = _getOfferKey(nftContract, tokenId);
        Offer storage offer = offers[offerKey][offerIndex];

        require(offer.active, "Offer not active");
        require(block.timestamp <= offer.expiry, "Offer expired");

        // Calculate fees
        (
            uint256 platformFeeAmount,
            uint256 royaltyAmount,
            address royaltyRecipient
        ) = _calculateFees(nftContract, tokenId, offer.amount, msg.sender);

        uint256 sellerAmount = offer.amount - platformFeeAmount - royaltyAmount;

        // Transfer payments
        _transferPayment(offer.currency, feeRecipient, platformFeeAmount);
        if (royaltyAmount > 0) {
            _transferPayment(offer.currency, royaltyRecipient, royaltyAmount);
        }
        _transferPayment(offer.currency, msg.sender, sellerAmount);

        // Transfer NFT
        IERC721(nftContract).safeTransferFrom(
            msg.sender,
            offer.offerer,
            tokenId
        );

        // Mark offer as inactive
        offer.active = false;
    }

    /**
     * @dev Calculate platform and royalty fees
     */
    function _calculateFees(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address seller
    )
        internal
        view
        returns (
            uint256 platformFeeAmount,
            uint256 royaltyAmount,
            address royaltyRecipient
        )
    {
        // Calculate platform fee with tier discount
        uint256 effectivePlatformFee = platformFee;
        if (tierDiscounts[seller] > 0) {
            effectivePlatformFee =
                platformFee -
                ((platformFee * tierDiscounts[seller]) / 10000);
        }
        platformFeeAmount = (price * effectivePlatformFee) / 10000;

        // Calculate royalty fee
        if (
            IERC165(nftContract).supportsInterface(type(IERC2981).interfaceId)
        ) {
            (royaltyRecipient, royaltyAmount) = IERC2981(nftContract)
                .royaltyInfo(tokenId, price);
        }
    }

    /**
     * @dev Handle payment (ETH or ERC20)
     */
    function _handlePayment(
        address currency,
        address from,
        uint256 amount
    ) internal {
        if (currency == address(0)) {
            require(msg.value >= amount, "Insufficient ETH");
            if (msg.value > amount) {
                payable(from).transfer(msg.value - amount);
            }
        } else {
            IERC20(currency).safeTransferFrom(from, address(this), amount);
        }
    }

    /**
     * @dev Transfer payment (ETH or ERC20)
     */
    function _transferPayment(
        address currency,
        address to,
        uint256 amount
    ) internal {
        if (amount == 0) return;

        if (currency == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(currency).safeTransfer(to, amount);
        }
    }

    /**
     * @dev Generate offer key
     */
    function _getOfferKey(
        address nftContract,
        uint256 tokenId
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(nftContract, tokenId)));
    }

    // Admin functions
    function setSupportedNFT(
        address nftContract,
        bool supported
    ) external onlyRole(ADMIN_ROLE) {
        supportedNFTs[nftContract] = supported;
    }

    function setSupportedToken(
        address token,
        bool supported
    ) external onlyRole(ADMIN_ROLE) {
        supportedTokens[token] = supported;
    }

    function setPlatformFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= MAX_PLATFORM_FEE, "Fee too high");
        platformFee = newFee;
    }

    function setTierDiscount(
        address user,
        uint256 discount
    ) external onlyRole(ADMIN_ROLE) {
        require(discount <= 5000, "Discount too high"); // Max 50%
        tierDiscounts[user] = discount;
    }

    function setFeeRecipient(
        address newRecipient
    ) external onlyRole(ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }

    // Emergency functions
    function emergencyWithdraw(address token) external onlyRole(ADMIN_ROLE) {
        if (token == address(0)) {
            payable(msg.sender).transfer(address(this).balance);
        } else {
            IERC20(token).safeTransfer(
                msg.sender,
                IERC20(token).balanceOf(address(this))
            );
        }
    }
}
