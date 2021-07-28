// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IcoToken is IERC20 {
    function owner() external view returns (address);
}