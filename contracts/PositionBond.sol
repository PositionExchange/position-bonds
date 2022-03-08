pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./impl/Issuer.sol";
import "./impl/UnderlyingAsset.sol";
import "./impl/FaceAsset.sol";
import "./impl/SaleStrategyBase.sol";
import "./impl/BondStatus.sol";
import "./impl/BondUnit.sol";
import {IPositionBond} from "./interfaces/IPositionBond.sol";

/// @title A title that should describe the contract/interface
/// @author The name of the author
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
abstract contract PositionBond is
    Issuer,
    BondStatus,
    UnderlyingAsset,
    FaceAsset,
    SaleStrategyBase,
    BondUnit,
    IPositionBond,
    ReentrancyGuard
{
    constructor(
        string memory bondName_,
        string memory bondSymbol_,
        address underlyingAsset_,
        uint256 collateralAmount_,
        address faceAsset_,
        uint256 faceValue_,
        uint256 totalSupply_
    )
        Issuer()
        BondUnit(totalSupply_, bondName_, bondSymbol_)
        FaceAsset(faceAsset_, faceValue_)
        UnderlyingAsset(underlyingAsset_, collateralAmount_)
    {
        emit BondCreated(
            bondName_,
            bondSymbol_,
            underlyingAsset_,
            collateralAmount_,
            faceAsset_,
            faceValue_,
            totalSupply_
        );
    }

    function faceAmount(address account) external view returns(uint256) {
        return FaceAsset._calculateFaceValueOut(balanceOf(account));
    }

    /**
     * @dev see {IPositionBond-active}
     */
    function active(
        uint64 _startSale,
        uint64 _active,
        uint64 _maturity
    ) public override(IPositionBond, BondStatus) onlyIssuer nonReentrant {
        super.active(_startSale, _active, _maturity);
        emit BondActivated(_startSale, _active, _maturity);
    }

    /**
     * @dev see {IPositionBond-claimUnderlyingAsset}
     */
    function claimUnderlyingAsset()
        public
        override(IPositionBond, UnderlyingAsset)
        onlyIssuer
        onlyMatured
        onlyReadyToClaim
        nonReentrant
    {
        UnderlyingAsset.claimUnderlyingAsset();
        BondStatus._setUnderlyingAssetStatusRefunded();
    }

    function claimLiquidatedUnderlyingAsset()
        public
        onlyMatured
        onlyLiquidated
    {
        uint256 _bondBalance = balanceOf(msg.sender);
        require(_bondBalance != 0, "invalid bond balance");
        _burn(msg.sender, _bondBalance);
        UnderlyingAsset._transferUnderlyingAssetLiquidated(
            _bondBalance,
            bondSupply
        );
    }

    /// @dev see {IPositionBond-claimSoldAmount}
    function claimSoldAmount(uint256 amount) external virtual onlyIssuer onlyActive nonReentrant {
        FaceAsset._transferOut(msg.sender, amount);
        emit SoldAmountClaimed(msg.sender, amount);
    }

    /**
     * @dev see {IPositionBond-claimFaceValue}
     */
    function claimFaceValue() external onlyMatured onlyReadyToClaimFaceValue nonReentrant {
        uint256 _bondBalance = balanceOf(msg.sender);
        require(_bondBalance != 0, "invalid bond balance");
        _burn(msg.sender, _bondBalance);
        FaceAsset._transferFaceValueOut(_bondBalance);
    }

    /**
     * @dev see {IPositionBond-claimRemainderUnderlyingAsset}
     */
    function claimRemainderUnderlyingAsset()
        external
        onlyActive
        onlyIssuer
    {
        UnderlyingAsset._transferRemainderUnderlyingAsset(
            bondSupply,
            totalSupply()
        );
    }

    /**
     * @dev see {IPositionBond-purchase}
     */
    function purchase(uint256 amount) external onlyOnSale purchasable nonReentrant {
        require(amount != 0, "invalid amount");
        (uint256 _bondAmount, uint256 _faceAmount) = getBondAmount(amount);
        require(_faceAmount != 0 && _bondAmount != 0, "out of bond");
        FaceAsset._transferIn(_faceAmount);
        BondUnit._mint(msg.sender, _bondAmount);
        _afterPurchase(msg.sender, _bondAmount);
        emit Purchased(msg.sender, _faceAmount, _bondAmount);
    }

    /**
     * @dev see {IPositionBond-repay}
     */
    function repay()
        external
        virtual
        onlyIssuer
        onlyMatured
        onlyNotReachTimeLiquidationTime
    {
        FaceAsset._transferRepaymentFaceValue(totalSupply());
        BondStatus._setUnderlyingAssetStatusReadyToClaim();
    }

    /// @dev see {IPositionBond-liquidate}
    function liquidate() external onlyReachLiquidationTime {
        BondStatus._setUnderlyingAssetStatusLiquidated();
        emit Liquidated(msg.sender);
    }

    function isPurchasable(address caller) public view virtual returns (bool){}

    /**
     *
     *      INTERNAL FUNCTIONS
     *
     */

    function _transferUnderlyingAsset()
        internal
        override(UnderlyingAsset, BondStatus)
    {
        UnderlyingAsset._transferUnderlyingAsset();
    }

    function _issuer() internal view override returns (address) {
        return issuer();
    }

    function _bondTransferable()
        internal
        override(BondUnit, BondStatus)
        returns (bool)
    {
        return BondStatus._bondTransferable();
    }

    /// @dev Hook function
    function _afterPurchase(address _buyer, uint256 _bondAmount)
        internal
        virtual
    {}
}
