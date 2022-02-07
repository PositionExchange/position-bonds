pragma solidity ^0.8.0;

import "../../strategy/extensions/HoldToken.sol";
import "../../strategy/FixedPriceBond.sol";

contract TestFixedPriceHoldToken is FixedPriceBond, HoldToken {
    constructor(
        string memory bondName_,
        string memory bondSymbol_,
        address underlyingAsset_,
        uint256 collateralAmount_,
        address faceAsset_,
        uint256 faceValue_,
        uint256 totalSupply_,
        uint256 issuePrice_,
        address holdToken_,
        uint256 minAmount_
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
        HoldToken(holdToken_, minAmount_)
    {}

    function canPurchase() public view override(FixedPriceBond) returns (bool) {
        return HoldToken._holdEnoughToken(msg.sender);
    }
}
