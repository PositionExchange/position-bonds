pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Issuer} from "./Issuer.sol";
import "hardhat/console.sol";
import {BondMath} from "../lib/BondMath.sol";

abstract contract UnderlyingAsset {
    using SafeERC20 for IERC20;

    event LiquidationUnderlyingAssetClaimed(
        address user,
        uint256 bondAmount,
        uint256 collateralAmount
    );

    IERC20 private _underlyingAsset;
    // collateral
    uint256 private _underlyingAmount;
    bool _remainderUnderlyingClaimed;

    constructor(address underlyingAsset_, uint256 underlyingAmount_) {
        _underlyingAsset = IERC20(underlyingAsset_);
        _underlyingAmount = underlyingAmount_;
    }

    function claimUnderlyingAsset() public virtual {
        _underlyingAsset.safeTransfer(
            _issuer(),
            _underlyingAmount
        );
    }

    function underlyingAsset() public view virtual returns (address, uint256) {
        return (address(_underlyingAsset), _underlyingAmount);
    }

    function _transferUnderlyingAsset() internal virtual {
        if (address(_underlyingAsset) != address(0)) {
            _underlyingAsset.safeTransferFrom(
                msg.sender,
                address(this),
                _underlyingAmount
            );
            // issuer needs cover any losses due to transfer token from issuer -> contract
            // if the transaction reverted with the following reason
            // issuer needs manually transfer the token to cover before 
            require(_underlyingAsset.balanceOf(address(this)) >= _underlyingAmount, "need to cover deflection fees");
        }
    }


    function _transferRemainderUnderlyingAsset(
        uint256 totalBondSupply,
        uint256 currentBondSupply
    ) internal {
        require(_remainderUnderlyingClaimed == false, "already claimed");
        uint256 remainderUnderlyingAsset = BondMath
            .calculateRemainderUnderlyingAsset(
                totalBondSupply,
                currentBondSupply,
                _underlyingAmount
            );
        _remainderUnderlyingClaimed = true;
        _underlyingAsset.safeTransfer(msg.sender, remainderUnderlyingAsset);
    }

    function _issuer() internal view virtual returns (address) {}

    function _transferUnderlyingAssetLiquidated(
        uint256 bondBalance,
        uint256 bondSupply
    ) internal {
        uint256 calculatedUnderlyingAsset = BondMath.calculateUnderlyingAsset(
            bondBalance,
            bondSupply,
            _underlyingAmount
        );
        _underlyingAsset.safeTransfer(msg.sender, calculatedUnderlyingAsset);
        emit LiquidationUnderlyingAssetClaimed(
            msg.sender,
            bondBalance,
            calculatedUnderlyingAsset
        );
    }
}
