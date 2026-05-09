// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice BUG: Missing access control on critical admin functions
/// Anyone can call withdraw() and drain the contract
contract BrokenAccessControl {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // ❌ VULNERABILITY: no onlyOwner modifier — any address can drain
    function withdraw(address payable to, uint256 amount) external {
        require(address(this).balance >= amount, "Insufficient contract balance");
        to.transfer(amount);
    }

    // ❌ VULNERABILITY: anyone can change the owner
    function setOwner(address newOwner) external {
        owner = newOwner;
    }
}
