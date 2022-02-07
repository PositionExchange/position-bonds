pragma solidity ^0.8.9;

import "../PositionBond.sol";
import "../lib/BondStruct.sol";

abstract contract FlexiblePriceBond is PositionBond {
    BondStruct.BondPriceRange[] public bondPriceRange;
    uint256 private immutable _issuePrice;

    constructor(
        string memory bondName_,
        string memory bondSymbol_,
        address underlyingAsset_,
        uint256 collateralAmount_,
        address faceAsset_,
        uint256 faceValue_,
        uint256 totalSupply_,
        BondStruct.BondPriceRange[] memory bondPriceRange_
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
        for (uint256 i = 0; i < bondPriceRange_.length; i++) {
            bondPriceRange.push(
                BondStruct.BondPriceRange({
                    min: bondPriceRange_[i].min,
                    max: bondPriceRange_[i].max,
                    price: bondPriceRange_[i].price
                })
            );
        }
        _issuePrice = BondMath.calculateIssuePriceWithRange(
            bondPriceRange_,
            totalSupply_
        );
        emit IssuePriceInitialized(_issuePrice);
    }

    function canPurchase() public view virtual override returns (bool) {}

    function isPurchasable(address caller) public view virtual override returns(bool) {}

    function issuePrice() public view virtual override returns (uint256) {
        return _issuePrice;
    }

    function getBondAmount(uint256 amount)
        public
        view
        virtual
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
        virtual
        override
    {}

    function _setLockDeadline() internal virtual {}
}
