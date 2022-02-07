pragma solidity ^0.8.9;

abstract contract TimeLock {
    uint256 public deadline;
    uint256 public immutable purchaseLockDuration;

    constructor(uint256 purchaseLockDuration_) {
        purchaseLockDuration = purchaseLockDuration_;
    }

    function _isNotLocked() public view virtual returns (bool) {
        return block.timestamp >= deadline;
    }

    function _setLockDeadline() internal virtual {
        deadline = block.timestamp + purchaseLockDuration;
    }
}
