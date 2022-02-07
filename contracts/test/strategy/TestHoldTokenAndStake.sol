pragma solidity ^0.8.0;

import "../../strategy/extensions/HoldTokenAndStake.sol";

contract TestHoldTokenAndStake is HoldTokenAndStake {
    constructor(address posi, uint256 minAmount_)
        HoldTokenAndStake(posi, minAmount_)
    {}

    // TEST

    //    function getTotalHold(address holder) public view returns (uint256 totalHold) {
    //
    //        uint256 posiBusdLp = _getLpPosiBusd(holder) +
    //        _posiBusdVault.lpOf(holder);
    //
    //        uint256 posiBnbLp = _getLpPosiBnb(holder) + _posiBnbVault.lpOf(holder);
    //
    //        totalHold = _posi.balanceOf(holder) +
    //        _getAmountPoolClassic(holder) +
    //        _getAmountPoolNFT(holder) +
    //        _getPosiByLpPosiBusd(posiBusdLp) +
    //        _getPosiByLpPosiBnb(posiBnbLp);
    //    }
    //
    //    function posiBusdLp(address holder) public view returns (uint256 lpBusdFarm, uint256 lpBusdVault, uint256 posiFromLpBusd) {
    //        uint256 posiBusdLp = _getLpPosiBusd(holder) + _posiBusdVault.lpOf(holder);
    //        lpBusdFarm = _getLpPosiBusd(holder);
    //        lpBusdVault = _posiBusdVault.lpOf(holder);
    //        posiFromLpBusd = _getPosiByLpPosiBusd(posiBusdLp);
    //    }
    //
    //
    //    function posiBnbLp(address holder) public view returns (uint256 lpBnbFarm, uint256 lpBnbVault, uint256 posiFromLpBnb){
    //        uint256 posiBnbLp = _getLpPosiBnb(holder) + _posiBnbVault.lpOf(holder);
    //        lpBnbFarm =  _getLpPosiBnb(holder);
    //        lpBnbVault =  _posiBnbVault.lpOf(holder);
    //        posiFromLpBnb = _getPosiByLpPosiBnb(posiBnbLp);
    //    }
    //
    //    function other(address holder) public view returns (uint256 posiWallet, uint256 posiPoolClassic, uint256 posiPoolNFT) {
    //        posiWallet = _posi.balanceOf(holder);
    //        posiPoolClassic = _getAmountPoolClassic(holder);
    //        posiPoolNFT = _getAmountPoolNFT(holder);
    //    }
}
