pragma solidity ^0.8.9;

import "../PositionBond.sol";

contract TestPositionBond is PositionBond {
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
        uint256 totalSupply_
    )
        PositionBond(
            bondName_,
            bondSymbol_,
            underlyingAsset_,
            collateralAmount_,
            faceAsset_,
            faceValue_,
            totalSupply_
        )
    {}

    function canPurchase() public view override returns (bool) {
        return _canPurchase;
    }

    function issuePrice() public view override returns (uint256) {
        return _issuePrice;
    }

    function getBondAmount(uint256 amount)
        public
        view
        override
        returns (uint256, uint256)
    {
        return (_bondAmount, amount);
    }

    function mockCanPurchase(bool val) public {
        _canPurchase = val;
    }

    function mockIssuePrice(uint256 price) public {
        _issuePrice = price;
    }

    function mockBondAmount(uint256 amount) public {
        _bondAmount = amount;
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
