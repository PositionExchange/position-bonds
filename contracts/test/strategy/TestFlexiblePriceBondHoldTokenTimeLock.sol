pragma solidity ^0.8.9;

import "../../strategy/FlexiblePriceBondHoldTokenTimeLock.sol";

contract TestFlexiblePriceBondHoldTokenTimeLock is FlexiblePriceBondHoldTokenTimeLock {
    // MOCK VARIABLES
    bool _canPurchase;
    uint256 _issuePrice;
    uint256 _bondAmount;
    uint256 public mockTime;

    constructor(
        string memory bondName_,
        string memory bondSymbol_,
        address underlyingAsset_,
        uint256 collateralAmount_,
        address faceAsset_,
        uint256 faceValue_,
        uint256 totalSupply_,
        BondStruct.BondPriceRange[] memory bondPriceRange_,
        address holdToken_,
        uint256 minAmount_,
        uint256 lockDuration_
    )
    FlexiblePriceBondHoldTokenTimeLock(
        bondName_,
        bondSymbol_,
        underlyingAsset_,
        collateralAmount_,
        faceAsset_,
        faceValue_,
        totalSupply_,
        bondPriceRange_,
        holdToken_,
        minAmount_,
        lockDuration_
    )
    {}

    function canPurchase() public view override(FlexiblePriceBondHoldTokenTimeLock) returns (bool) {
        return FlexiblePriceBondHoldTokenTimeLock.canPurchase();
    }

    function issuePrice() public view override returns (uint256) {
        return FlexiblePriceBondHoldTokenTimeLock.issuePrice();
    }

    function getBondAmount(uint256 amount)
    public
    view
    override(FlexiblePriceBondHoldTokenTimeLock)
    returns (uint256, uint256)
    {
        return FlexiblePriceBondHoldTokenTimeLock.getBondAmount(amount);
    }

    function _now() internal view override returns (uint256) {
        return mockTime;
    }

    function setMockTime(uint256 _mockTime) public {
        mockTime = _mockTime;
    }

    function setMockTimeLiquidate(uint64 _mockTimeLiquidate) public {
        BondStatus.liquidationTime = Timestamp.wrap(_mockTimeLiquidate);
    }

    function setUnderlyingAssetStatusReadyToClaimMock() public {
        BondStatus._setUnderlyingAssetStatusReadyToClaim();
    }

    function setUnderlyingAssetStatusRefundedMock() public {
        BondStatus._setUnderlyingAssetStatusRefunded();
    }

    function setUnderlyingAssetStatusLiquidatedMock() public {
        BondStatus._setUnderlyingAssetStatusLiquidated();
    }

}
