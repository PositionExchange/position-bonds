pragma solidity ^0.8.9;
import "./strategy/FlexiblePriceBond.sol";
import "./strategy/extensions/TimeLock.sol";
import "./strategy/extensions/HoldTokenAndStake.sol";
import "./lib/BondStruct.sol";
import "./lib/BondStruct.sol";

contract PositionBond01 is FlexiblePriceBond, TimeLock, HoldTokenAndStake {
    constructor(
        string memory bondName_,
        string memory bondSymbol_,
        address underlyingAsset_,
        uint256 collateralAmount_,
        address faceAsset_,
        uint256 faceValue_,
        uint256 totalSupply_,
        uint64 purchaseLockDuration_,
        BondStruct.BondPriceRange[] memory rangeBondPrice_,
        address holdToken_,
        uint256 minAmount_
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
        HoldTokenAndStake(holdToken_, minAmount_)
    {}

    function canPurchase()
        public
        view
        override(FlexiblePriceBond)
        returns (bool)
    {
        return
            TimeLock._isNotLocked() &&
            HoldTokenAndStake._holdEnoughToken(msg.sender);
    }

    function isPurchasable(address caller)
        public
        view
        override(FlexiblePriceBond)
        returns (bool)
    {
        return
        TimeLock._isNotLocked() &&
        HoldTokenAndStake._holdEnoughToken(caller);
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
        override
        returns (uint256, uint256)
    {
        uint256 _currentSupply = totalSupply();
        BondStruct.BondPriceRange[] memory _bondPriceRange = bondPriceRange;
        return
            BondMath.getBondAmountInRange(
                _bondPriceRange,
                _currentSupply,
                amount
            );
    }

    function _afterPurchase(address _buyer, uint256 _bondAmount)
        internal
        override
    {
        uint256 currentSupply = totalSupply();
        for (uint256 i = 0; i < bondPriceRange.length; i++) {
            if (currentSupply == bondPriceRange[i].max) {
                _setLockDeadline();
                break;
            }
        }
    }

    function _setLockDeadline() internal override(FlexiblePriceBond, TimeLock) {
        TimeLock._setLockDeadline();
    }
}
