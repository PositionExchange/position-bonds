pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {BondMath} from "../lib/BondMath.sol";
import "hardhat/console.sol";

abstract contract FaceAsset {
    using SafeERC20 for IERC20;

    event FaceValueClaimed(address user, uint256 amount);
    event FaceValueDeposited(uint256 amount);
    event FaceValueRepaid(
        uint256 amount,
        uint256 bondAmount,
        uint256 faceValue
    );

    IERC20 private _faceAsset;
    uint256 private _faceValue;

    constructor(address faceAsset_, uint256 faceValue_) {
        _faceAsset = IERC20(faceAsset_);
        _faceValue = faceValue_;
    }

    function _transferIn(uint256 amount) internal virtual {
        _faceAsset.safeTransferFrom(msg.sender, address(this), amount);
    }

    function _transferOut(address recipient, uint256 amount) internal virtual {
        _faceAsset.safeTransfer(recipient, amount);
    }

    function faceAsset() public view virtual returns (address) {
        return address(_faceAsset);
    }

    function faceValue() public view virtual returns (uint256) {
        return _faceValue;
    }

    function _calculateFaceValueOut(uint256 bondAmount) internal virtual view returns(uint256){
        return BondMath.calculateFaceValue(
            bondAmount,
            _faceValue
        );
    }

    /// @dev Calculate the face value and transfer in
    /// inherit contract must implement
    /// @param totalSupply The bond amount
    function _transferRepaymentFaceValue(uint256 totalSupply) internal virtual {
        uint256 calculatedFaceValue = BondMath.calculateFaceValue(
            totalSupply,
            _faceValue
        );
        _transferIn(calculatedFaceValue);
        // issuer needs cover any losses due to transfer token from issuer -> contract
        // if the transaction reverted with the following reason
        // issuer needs manually transfer the token to cover losses before repay the face value
        require(_faceAsset.balanceOf(address(this)) >= calculatedFaceValue, "need to cover deflection fees");
        emit FaceValueRepaid(calculatedFaceValue, totalSupply, _faceValue);
    }

    /// @dev Calculate the face value and transfer in
    /// inherit contract must implement
    /// @param bondAmount The bond amount
    function _transferFaceValueOut(uint256 bondAmount) internal virtual {
        uint256 calculatedFaceValue = BondMath.calculateFaceValue(
            bondAmount,
            _faceValue
        );
        _transferOut(msg.sender, calculatedFaceValue);
        emit FaceValueClaimed(msg.sender, calculatedFaceValue);
    }
}
