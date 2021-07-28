// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IcoToken.sol";

 /// @title 
 /// @author 

contract Token is ERC20, IcoToken {
    address private _owner;

    constructor(address owner_) ERC20("HmToken", "HMT") {
        _owner = owner_;
        _mint(owner_, 1000000 * 10**decimals());
    }

    function owner() public view override returns (address) {
        return _owner;
    }
}
