pragma solidity ^0.8.9;

interface IVault {
    function lpOf(address user) external view returns (uint256);

    function balanceOf(address user) external view returns (uint256);
}
