const KEKCoin = artifacts.require("KEKCoin")

require('chai').should()

contract('KEKCoin', accounts =>{
	const _name = 'KEKCoin';
	const _symbol = 'KEK';

	beforeEach(async function (){
		this.token = await KEKCoin.new(_name, _symbol);
	});

	describe('token attributes', function(){
		it('has the correct name', async function(){
			const name = await this.token.name();
			name.should.equal(_name);
		});
		it('has the correct symbol', async function(){
			const name = await this.token.symbol();
			name.should.equal(_symbol);
		});
		it('check token mint function', async function(){
			const token = this.token;

			await this.token.mint(accounts[0], 47);
			let bal = await this.token.balanceOf(accounts[0]);
			
			expect(bal.toNumber(),"balance of owner should be 47").to.be.equal(47);
		});
	});
});
