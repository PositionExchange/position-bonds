pragma solidity ^0.8.9;

import "../../strategy/FixedPriceBond.sol";

contract TestFixedPrice is FixedPriceBond {
    constructor(
        string memory bondName_,
        string memory bondSymbol_,
        address underlyingAsset_,
        uint256 collateralAmount_,
        address faceAsset_,
        uint256 faceValue_,
        uint256 totalSupply_,
        uint256 issuePrice_
    )
        FixedPriceBond(
            bondName_,
            bondSymbol_,
            underlyingAsset_,
            collateralAmount_,
            faceAsset_,
            faceValue_,
            totalSupply_,
            issuePrice_
        )
    {}
}
