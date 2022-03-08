pragma solidity ^0.8.9;

import "../lib/Timers.sol";
import "hardhat/console.sol";

abstract contract BondStatus {
    using Timers for Timestamp;
    enum Status {
        Pending,
        OnSale,
        Active,
        Matured
    }

    enum UnderlyingAssetStatus {
        Pending,
        OnHold,
        Liquidated,
        ReadyToClaim,
        Refunded
    }

    struct StatusData {
        // packed slot
        // timestamp
        Timestamp startSale;
        Timestamp active;
        Timestamp maturity;
        // end timestamp
        uint8 underlyingAssetStatus; // 0: pending, 1: on hold, 2: liquidated, 3: ready to claim, 4: refunded
    }

    StatusData private statusData;

    // Afters hours will liquidated
    uint64 private constant liquidationDeadline = 15 days;

    // correctly time liquidated
    Timestamp public liquidationTime;

    modifier onlyOnSale() {
        require(_isOnSale(), "only on sale");
        _;
    }

    modifier onlyActive() {
        require(_isActive(), "only active");
        _;
    }

    modifier onlyMatured() {
        require(_isMatured(), "only matured");
        _;
    }

    modifier onlyReadyToClaim() {
        require(_isReadyToClaim(), "only ready to claim");
        _;
    }

    modifier onlyReadyToClaimFaceValue() {
        require(_isReadyToClaim() || _isRefunded(), "only ready to claim face value");
        _;
    }

    modifier onlyLiquidated() {
        require(_isLiquidated(), "only liquidated");
        _;
    }

    modifier onlyReachActiveTime() {
        require(_isReachActiveTime(), "only reach active time");
        _;
    }

    modifier onlyReachLiquidationTime() {
        require(_isReachLiquidationTime(), "only reach liquidation time");
        _;
    }

    modifier onlyNotReachTimeLiquidationTime() {
        require(!_isReachLiquidationTime(), "only not reach liquidation time");
        _;
    }
    modifier onlyRefunded() {
        require(_isRefunded(), "only refunded");
        _;
    }

    function getLiquidationDeadline() public view returns (uint64) {
        return liquidationDeadline;
    }

    function getStatus() public view virtual returns (Status) {
        //save gas
        StatusData memory _statusData = statusData;
        if (_statusData.underlyingAssetStatus == 0) {
            return Status.Pending;
        } else {
            if (_statusData.maturity.passed(_now())) {
                return Status.Matured;
            }
            if (_statusData.active.passed(_now())) {
                return Status.Active;
            }
            if (_statusData.startSale.passed(_now())) {
                return Status.OnSale;
            }
            return Status.Pending;
        }
    }

    function getUnderlyingAssetStatus()
        public
        view
        virtual
        returns (UnderlyingAssetStatus)
    {
        StatusData memory _statusData = statusData;
        if (_statusData.underlyingAssetStatus == 0) {
            return UnderlyingAssetStatus.Pending;
        } else if (_statusData.underlyingAssetStatus == 1) {
            return UnderlyingAssetStatus.OnHold;
        } else if (_statusData.underlyingAssetStatus == 2) {
            return UnderlyingAssetStatus.Liquidated;
        } else if (_statusData.underlyingAssetStatus == 3) {
            return UnderlyingAssetStatus.ReadyToClaim;
        } else return UnderlyingAssetStatus.Refunded;
    }

    function getStatusData() public view virtual returns (StatusData memory) {
        return statusData;
    }

    function active(
        uint64 _startSale,
        uint64 _active,
        uint64 _maturity
    ) public virtual {
        require(statusData.underlyingAssetStatus == 0, "!pending");
        require(_startSale < _active && _active < _maturity, "!time");
        _transferUnderlyingAsset();
        statusData = StatusData({
            startSale: Timestamp.wrap(_startSale),
            active: Timestamp.wrap(_active),
            maturity: Timestamp.wrap(_maturity),
            underlyingAssetStatus: 1
        });
        liquidationTime = Timestamp.wrap(_maturity + liquidationDeadline);
    }

    function _setUnderlyingAssetStatusPending() internal virtual {
        statusData.underlyingAssetStatus = 0;
    }

    function _setUnderlyingAssetStatusOnHold() internal virtual {
        statusData.underlyingAssetStatus = 1;
    }

    function _setUnderlyingAssetStatusLiquidated() internal virtual {
        require(
            getUnderlyingAssetStatus() == UnderlyingAssetStatus.OnHold,
            "!OnHold"
        );
        statusData.underlyingAssetStatus = 2;
    }

    function _setUnderlyingAssetStatusReadyToClaim() internal virtual {
        require(
            getUnderlyingAssetStatus() == UnderlyingAssetStatus.OnHold,
            "!OnHold"
        );
        statusData.underlyingAssetStatus = 3;
    }

    function _setUnderlyingAssetStatusRefunded() internal virtual {
        require(
            getUnderlyingAssetStatus() == UnderlyingAssetStatus.ReadyToClaim,
            "!ReadyToClaim"
        );
        statusData.underlyingAssetStatus = 4;
    }

    function _isPending() internal view virtual returns (bool) {
        return getStatus() == Status.Pending;
    }

    function _isOnSale() internal view virtual returns (bool) {
        return getStatus() == Status.OnSale;
    }

    function _isActive() internal view virtual returns (bool) {
        return getStatus() == Status.Active;
    }

    function _isMatured() internal view virtual returns (bool) {
        return getStatus() == Status.Matured;
    }

    function _isReadyToClaim() internal view virtual returns (bool) {
        return getUnderlyingAssetStatus() == UnderlyingAssetStatus.ReadyToClaim;
    }

    function _isLiquidated() internal view virtual returns (bool) {
        return getUnderlyingAssetStatus() == UnderlyingAssetStatus.Liquidated;
    }

    function _isReachActiveTime() internal view virtual returns (bool) {
        require(statusData.active.unwrap() != 0, "not activated yet");
        return statusData.active.passed(_now());
    }

    function _isReachLiquidationTime() internal view virtual returns (bool) {
        require(liquidationTime.unwrap() != 0, "not activated yet");
        return liquidationTime.passed(_now());
    }

    function _isRefunded() internal view virtual returns (bool) {
        return getUnderlyingAssetStatus() == UnderlyingAssetStatus.Refunded;
    }

    //for injeting test
    function _now() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    function _bondTransferable() internal virtual returns (bool) {
        Status _status = getStatus();
        return _status == Status.Active || _status == Status.Matured;
    }

    function _transferUnderlyingAsset() internal virtual {}
}
