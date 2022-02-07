pragma solidity ^0.8.9;

import "../impl/BondStatus.sol";

contract TestBondStatus is BondStatus {
    uint256 public mockTime;

    function _now() internal view override returns (uint256) {
        return mockTime;
    }

    function setMockTime(uint256 _mockTime) public {
        mockTime = _mockTime;
    }
}
