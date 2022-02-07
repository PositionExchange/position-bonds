pragma solidity ^0.8.9;
import "./strategy/FlexiblePriceBond.sol";
import "./strategy/extensions/TimeLock.sol";
import "./lib/BondStruct.sol";
import "./impl/FaceAsset.sol";

contract PositionBond002 is FaceAsset, FlexiblePriceBond, TimeLock {
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

    function claimSoldAmount(uint256 amount) external override {
        revert("not support");
    }

    function repay()
        external
        override
        onlyIssuer
        onlyMatured
        onlyNotReachTimeLiquidationTime
    {
        _setUnderlyingAssetStatusReadyToClaim();
    }

    // claim without discount
    // EMERGENCY only
    function emergencyClaimFaceValue(uint256 _amount)
        external
        onlyMatured
    {
        uint256 _bondBalance = balanceOf(msg.sender);
        if (_amount > _bondBalance){
            _amount = _bondBalance;
        }
        uint256 _claimable = _amount * issuePrice() / 10**18;
        _burn(msg.sender, _amount);
        FaceAsset._transferOut(msg.sender, _claimable);
    }

    function canPurchase()
        public
        view
        override(FlexiblePriceBond)
        returns (bool)
    {
        return
            TimeLock._isNotLocked();
    }

    function isPurchasable(address caller)
        public
        view
        override(FlexiblePriceBond)
        returns (bool)
    {
        return
        TimeLock._isNotLocked();
    }

    function issuePrice()
        public
        view
        override
        returns (uint256)
    {
        // weighted price
        return 10000000000000000000;
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
