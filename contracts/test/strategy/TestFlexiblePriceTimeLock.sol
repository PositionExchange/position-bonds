pragma solidity ^0.8.9;

import "../../strategy/FlexiblePriceBond.sol";
import "../../strategy/extensions/TimeLock.sol";
import "../../lib/BondStruct.sol";

contract TestFlexiblePriceTimeLock is FlexiblePriceBond, TimeLock {
    constructor(
        string memory bondName_,
        string memory bondSymbol_,
        address underlyingAsset_,
        uint256 collateralAmount_,
        address faceAsset_,
        uint256 faceValue_,
        uint256 totalSupply_,
        uint64 purchaseLockDuration_,
        BondStruct.BondPriceRange[] memory rangeBondPrice_
    )
        FlexiblePriceBond(
            bondName_,
            bondSymbol_,
            underlyingAsset_,
            collateralAmount_,
            faceAsset_,
            faceValue_,
            totalSupply_,
            rangeBondPrice_
        )
        TimeLock(purchaseLockDuration_)
    {}

    function canPurchase()
        public
        view
        override(FlexiblePriceBond)
        returns (bool)
    {
        return super.canPurchase();
    }

    function issuePrice()
        public
        view
        override(FlexiblePriceBond)
        returns (uint256)
    {
        return super.issuePrice();
    }

    function getBondAmount(uint256 amount)
        public
        view
        override(FlexiblePriceBond)
        returns (uint256, uint256)
    {
        return super.getBondAmount(amount);
    }

    function _setLockDeadline() internal override(FlexiblePriceBond, TimeLock) {
        TimeLock._setLockDeadline();
    }
}
