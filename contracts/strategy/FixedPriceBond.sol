pragma solidity ^0.8.9;

import "../PositionBond.sol";

abstract contract FixedPriceBond is PositionBond {
    uint256 private immutable _issuePrice;

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
        PositionBond(
            bondName_,
            bondSymbol_,
            underlyingAsset_,
            collateralAmount_,
            faceAsset_,
            faceValue_,
            totalSupply_
        )
    {
        _issuePrice = issuePrice_;
    }

    function issuePrice() public view virtual override returns (uint256) {
        return _issuePrice;
    }

    function canPurchase() public view virtual override returns (bool) {}

    function isPurchasable(address caller) public view virtual override returns(bool) {}

    function getBondAmount(uint256 amount)
        public
        view
        virtual
        override
        returns (uint256, uint256)
    {
        uint256 calculatedBondAmount = BondMath.calculateBondAmountWithFixPrice(
            amount,
            _issuePrice
        );
        return (calculatedBondAmount, amount);
    }
}
