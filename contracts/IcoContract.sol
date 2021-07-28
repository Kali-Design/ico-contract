// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IcoToken.sol";


 /// @title 
 /// @author
 /// @dev 

contract IcoContract is Ownable {
    using Address for address payable;

    IcoToken private _token;
    uint256 private _end;
    uint256 private _DURATION = 14 days;

    event Purchase(address indexed buyer, uint256 amount);
    event Withdrew(address indexed owner, uint256 amount);

   
    /// @dev Set the ERC20 address and start the ICO for 14 days.
    /// @param tokenAddress Set the address of the ERC20.
    
    constructor(address tokenAddress) {
        _token = IcoToken(tokenAddress);
        require(_token.balanceOf(_token.owner()) == 1000000 * 10**18, "ICO: The owner must have token for exchange");
        _end = block.timestamp + _DURATION;
    }


    /// @dev Use to receive ether directly from a transaction
    receive() external payable {
        _buyTokens(msg.sender, msg.value);
    }

    /// @dev Use withdraw function when ICO date finished
    function withdraw() public onlyOwner {
        require(block.timestamp >= _end, "ICO: you need to wait 14 days from the deployment of this contract");
        uint256 gain = address(this).balance;
        payable(msg.sender).sendValue(address(this).balance);
        emit Withdrew(msg.sender, gain);
    }

    /// @dev Use to buy platform Ether
    function buyTokens() public payable {
        _buyTokens(msg.sender, msg.value);
    }

    /// @dev Exchange rate
    /// @param amount = Ether 
    /// @return value 
    function conversion(uint256 amount) public pure returns (uint256) {
        return amount * 10**9;
    }

    /// @dev Total Ether this ICO
    function total() public view returns (uint256) {
        return address(this).balance;
    }

    /// @dev ICO is finished
    /// @return Time left before the end ICO
    function timeLeft() public view returns (uint256) {
        require(block.timestamp < _end, "ICO: there is no time left");
        return _end - block.timestamp;
    }

    /// @dev allows investors to buy tokens
    /// @param sender : The investors
    /// @param amount = Ether 
    function _buyTokens(address sender, uint256 amount) private {
        require(block.timestamp < _end, "ICO: 14 days have passed, you can not buy token");
        uint256 allowance = _token.allowance(_token.owner(), address(this));
        require(allowance > 0, "ICO: You have not approved because all token are already sold");
        uint256 token = conversion(amount);
        if (token > allowance) {
            uint256 rest = token - allowance;
            token -= rest;
            payable(sender).sendValue(rest / 10**9);
        }
        _token.transferFrom(_token.owner(), sender, token);
        emit Purchase(sender, amount);
    }
}
