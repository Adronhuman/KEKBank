// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract KEKCoin is ERC20 {

	address public owner = msg.sender;

	constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
	}

	modifier onlyOwner() { 
        require (msg.sender == owner, 'Error, msg.sender must be a owner'); 
        _; 
    }

	function changeOwner(address newOwner) public onlyOwner {
		owner = newOwner;
	}

	function mint(address _account, uint _amount) public onlyOwner {
		_mint(_account, _amount);
	}

}
