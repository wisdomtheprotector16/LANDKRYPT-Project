//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract Oracle {
    AggregatorV3Interface internal priceFeed;

    constructor(address _priceFeedAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    // Get the latest price of ETH/USD
    function getLatestETHPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    // Convert ETH to USD (wei to USD)
    function convertETHToUSD(uint256 ethAmount) public view returns (uint256) {
        int256 ethPrice = getLatestETHPrice();
        require(ethPrice > 0, "Invalid price feed");
        // ETH price feed has 8 decimals, ETH amount is in wei (18 decimals)
        // Result in USD with 18 decimals: (ethAmount * ethPrice) / 1e8
        return (ethAmount * uint256(ethPrice)) / 1e8;
    }
}