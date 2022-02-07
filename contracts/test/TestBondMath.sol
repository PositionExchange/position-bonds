pragma solidity ^0.8.9;

import {BondMath} from "../lib/BondMath.sol";

contract TestBondMath {
    function calculateFaceValue(uint256 bondUnit, uint256 faceValue)
        public
        view
        returns (uint256)
    {
        return BondMath.calculateFaceValue(bondUnit, faceValue);
    }

    function calculateUnderlyingAsset(
        uint256 bondBalance,
        uint256 bondSupply,
        uint256 underlyingAmount
    ) public view returns (uint256) {
        return
            BondMath.calculateUnderlyingAsset(
                bondBalance,
                bondSupply,
                underlyingAmount
            );
    }

    function calculateRemainderUnderlyingAsset(uint256 totalBondSupply, uint256 currentBondSupply, uint256 underlyingAmount) public pure returns (uint256) {
        return (totalBondSupply - currentBondSupply) * underlyingAmount / totalBondSupply;
    }
}
