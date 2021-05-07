const KEKCoin = artifacts.require("KEKCoin")
const Bank = artifacts.require("Bank")

module.exports = async function (deployer){
	
	await deployer.deploy(KEKCoin, "KEKCoin", "KEK");
	const kekCoin = await KEKCoin.deployed();

	await deployer.deploy(Bank, kekCoin.address);
	const bank = await Bank.deployed();
 	
 	const adr = await bank.address;
 	const own = await kekCoin.owner();

 	// await kekCoin.mint(await kekCoin.address, "100000000000000000000000000");
	await kekCoin.mint(await bank.address, "100000000000000000000000000");

	await kekCoin.changeOwner(bank.address);


}