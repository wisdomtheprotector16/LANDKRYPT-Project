// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStakingFactory {
    function getStakingContractForNFT(uint256 tokenId) external view returns (address);
    function getNFTForStakingContract(address stakingContract) external view returns (uint256);
    function getStakingContractsCount() external view returns (uint256);
    function getStakingContractsPaginated(uint256 start, uint256 end) external view returns (address[] memory);
}
