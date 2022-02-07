pragma solidity ^0.8.8;

import "../impl/UnderlyingAsset.sol";

contract TestUnderlyingContract is UnderlyingAsset {
    constructor(address underlyingAsset_, uint256 underlyingAmount_)
        UnderlyingAsset(underlyingAsset_, underlyingAmount_)
    {}

    function transferUnderlyingAsset() public {
        _transferUnderlyingAsset();
    }
}
