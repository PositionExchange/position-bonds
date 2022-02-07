pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../../interfaces/IPosiStakingManager.sol";
import "../../interfaces/IGeneralNFTReward.sol";
import "../../interfaces/IVault.sol";
import "../../interfaces/IUniswapV2Pair.sol";
import "../../interfaces/IUniswapV2Factory.sol";
import "../../interfaces/IUniswapV2Router02.sol";

abstract contract HoldTokenAndStake {
    using SafeMath for uint256;
    // Constant
    uint256 private constant POSI_BUSD_PID = 0;
    uint256 private constant POSI_BNB_PID = 2;
    uint256 private constant POSI_POOL = 1;

    IUniswapV2Factory private factory =
        IUniswapV2Factory(0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73);
    IUniswapV2Router02 private router =
        IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);

    IPosiStakingManager private _posiStakingManager =
        IPosiStakingManager(0x0C54B0b7d61De871dB47c3aD3F69FEB0F2C8db0B);

    // Pool NFT
    IGeneralNFTReward private _generalNFTReward =
        IGeneralNFTReward(0xbE9FF181BFA9dd78191B81B23Fd4ff774a3fB4F1);

    // Vault
    IVault private _posiBusdVault =
        IVault(0xf35848441017917a034589BfbEc4B3783BB39cb2);
    IVault private _posiBnbVault =
        IVault(0xC1742A30b7469f49f37239B1c2905876821700e8);

    // token ERC20
    IERC20 private constant _busd =
        IERC20(0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56);
    IERC20 private immutable _weth;

    IERC20 private _posi;
    uint256 private _minAmount;

    constructor(address holdToken_, uint256 minAmount_) {
        _posi = IERC20(holdToken_);
        _minAmount = minAmount_;
        _weth = IERC20(router.WETH());
    }

    function _holdEnoughToken(address holder) public view returns (bool) {
        uint256 _lpPosiBusd = _getLpPosiBusd(holder) +
            _posiBusdVault.lpOf(holder);

        uint256 lpPosiBnb = _getLpPosiBnb(holder) + _posiBnbVault.lpOf(holder);

        uint256 totalHold = _posi.balanceOf(holder) +
            _getAmountPoolClassic(holder) +
            _getAmountPoolNFT(holder) +
            _getPosiByLpPosiBusd(_lpPosiBusd) +
            _getPosiByLpPosiBnb(lpPosiBnb);
        return totalHold >= _minAmount;
    }

    function _getAmountPoolClassic(address holder)
        internal
        view
        returns (uint256 amount)
    {
        (amount, , , ) = _posiStakingManager.userInfo(POSI_POOL, holder);
        return amount;
    }

    function _getLpPosiBusd(address holder)
        internal
        view
        returns (uint256 amount)
    {
        (amount, , , ) = _posiStakingManager.userInfo(POSI_BUSD_PID, holder);
        return amount;
    }

    function _getLpPosiBnb(address holder)
        internal
        view
        returns (uint256 amount)
    {
        (amount, , , ) = _posiStakingManager.userInfo(POSI_BNB_PID, holder);
        return amount;
    }

    function _getAmountPoolNFT(address holder) internal view returns (uint256) {
        return _generalNFTReward.balanceOf(holder);
    }

    function _getTokenHold(address holder) internal view returns (uint256) {
        return _posi.balanceOf(holder);
    }

    // POSI/BUSD
    function _getSwappingPairPosiBusd() internal view returns (IUniswapV2Pair) {
        return IUniswapV2Pair(factory.getPair(address(_posi), address(_busd)));
    }

    function _getPosiByLpPosiBusd(uint256 lp)
        internal
        view
        returns (uint256 amount)
    {
        IUniswapV2Pair pair = _getSwappingPairPosiBusd();
        uint256 balance0 = _posi.balanceOf(address(pair));
        uint256 balance1 = _busd.balanceOf(address(pair));
        uint256 _totalSupply = pair.totalSupply();
        uint256 amount0 = lp.mul(balance0) / _totalSupply;
        uint256 amount1 = lp.mul(balance1) / _totalSupply;
        amount = amount0.add(amount1.mul(balance0).div(balance1));
    }

    //POSI/BNB
    function _getSwappingPairPosiBnb() internal view returns (IUniswapV2Pair) {
        return IUniswapV2Pair(factory.getPair(address(_posi), address(_weth)));
    }

    function _getPosiByLpPosiBnb(uint256 lp)
        internal
        view
        returns (uint256 amount)
    {
        IUniswapV2Pair pair = _getSwappingPairPosiBnb();
        uint256 balance0 = _posi.balanceOf(address(pair));
        uint256 balance1 = _weth.balanceOf(address(pair));
        uint256 _totalSupply = pair.totalSupply();
        uint256 amount0 = lp.mul(balance0) / _totalSupply;
        uint256 amount1 = lp.mul(balance1) / _totalSupply;
        // convert amount0 -> amount1
        amount = amount0.add(amount1.mul(balance0).div(balance1));
    }
}
