pragma solidity ^0.8.9;

abstract contract Issuer {
    address private _issuer;

    constructor() {
        _issuer = msg.sender;
    }

    modifier onlyIssuer() {
        require(msg.sender == _issuer, "only issuer");
        _;
    }

    function issuer() public view virtual returns (address) {
        return _issuer;
    }

    //TODO: change issuer function
}
