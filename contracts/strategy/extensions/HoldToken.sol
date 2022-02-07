pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract HoldToken {
    IERC20 private _holdToken;
    uint256 private _minAmount;

    constructor(address holdToken_, uint256 minAmount_) {
        _holdToken = IERC20(holdToken_);
        _minAmount = minAmount_;
    }

    function _holdEnoughToken(address holder)
        public
        view
        virtual
        returns (bool)
    {
        return _holdToken.balanceOf(holder) >= _minAmount;
    }
}
