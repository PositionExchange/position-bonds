pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title BondUnit contract
/// @author Justin Position
/// @dev Control bond units (token)
abstract contract BondUnit is ERC20 {
    // the fixed supply bond ever mint
    uint256 public immutable bondSupply;

    constructor(
        uint256 bondSupply_,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        bondSupply = bondSupply_;
    }

    function _mint(address account, uint256 amount) internal override(ERC20) {
        super._mint(account, amount);
        require(totalSupply() <= bondSupply , "over supply");
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20) {
        if (from != address(0))
            require(_bondTransferable(), "not transferable");
    }

    function _bondTransferable() internal virtual returns (bool);
}
