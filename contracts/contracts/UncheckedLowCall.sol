// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice BUG: Unchecked low-level call return values
/// Failed transfers are silently ignored — funds can be lost
contract UncheckedLowCall {
    address public recipient;

    constructor(address _recipient) {
        recipient = _recipient;
    }

    // ❌ VULNERABILITY: return value of call() not checked
    // If recipient is a contract that reverts, ETH is stuck silently
    function sendFunds() external payable {
        recipient.call{value: msg.value}("");  // return value ignored
    }

    // ❌ VULNERABILITY: send() returns bool but it's discarded
    function sendWithSend() external payable {
        payable(recipient).send(msg.value);    // failure silently ignored
    }
}
