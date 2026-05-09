// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice BUG: Classic reentrancy — state updated AFTER external call
/// Attacker can recursively drain funds before balance is zeroed
contract ReentrantVault {
    mapping(address => uint256) public balances;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        // ❌ VULNERABILITY: external call before state update
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        balances[msg.sender] = 0;  // too late — attacker already re-entered
        emit Withdrawal(msg.sender, amount);
    }
}
