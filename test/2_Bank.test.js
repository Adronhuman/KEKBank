const { SECONDS_IN_DAY,EVM_REVERT,timeTravel } = require('./helper')

const KEKCoin = artifacts.require("KEKCoin")
const Bank = artifacts.require("Bank")

// var chai = require('chai')
//   , expect = chai.expect
//   , should = chai.should();
require('chai')
  .use(require('chai-as-promised'))
  .should()
  .expect

contract('Bank', accounts =>{
	const _name = 'KEKCoin';
	const _symbol = 'KEK';
 
	beforeEach(async function (){
		this.token = await KEKCoin.new(_name, _symbol);
		this.bank = await Bank.new(this.token.address);
	});

	describe('initial Bank test', async function(){
				
		it('check initial balance', async function(){
			let balance = await this.token.balanceOf(this.bank.address).then(x => x = x.toNumber());
			expect(balance,"balance of owner should be 0").to.be.equal(0);

			let totalSupply = await this.token.totalSupply();
			totalSupply = totalSupply.toNumber();
			expect(totalSupply,"totalSupply should be 0").to.be.equal(0);
		});

		it("check default programs", async function(){
			const bank = this.bank;
 
			let real_program = await bank.getDepositProgram(1); 
			let expected_program = '["1",true,"12","500","0"]';
			expect(JSON.stringify(real_program), "program properties not equal to expected")
			.to.be.equal(expected_program);
			// expect(program);
		});

	});

	describe('Bank deposit functionality',  ()=>{
		beforeEach(async function (){
			await this.token.mint(accounts[0], 10000000);
			await this.token.mint(this.bank.address,100000000);
			await this.token.approve(this.bank.address, 10000000);
		});

		it("testing deposit success", async function(){
			await this.bank.deposit(10000000,1);

			let res = await this.bank.getDepositBalance(1);
			let bal = await this.token.balanceOf(accounts[0]);
			expect(bal.toNumber(),"token balance should be 0").to.be.equal(0);
			expect(res.toNumber(),"deposit balance should be equal 18").to.be.equal(10000000);
		});
		it('test deposit reject', async function(){
			await this.bank.deposit(10000000, 6).should.be.rejectedWith(EVM_REVERT); //not-exist program
			await this.bank.deposit(0, 1).should.be.rejectedWith(EVM_REVERT); // 0 amount

			await this.bank.addDepositProgram(1, false, 12, 5*10**2, 0);
			await this.bank.deposit(10000000, 1).should.be.rejectedWith(EVM_REVERT); //non-active program
		});

		it('testing deposit-withdraw cycle', async function(){
			const bank =  this.bank;
			const token = this.token;

			await this.bank.deposit(10000000,1);

			let res = await this.bank.getDepositBalance(1);
			let bal = await this.token.balanceOf(accounts[0]);
			expect(bal.toNumber(),"token balance should be 0").to.be.equal(0);
			expect(res.toNumber(),"deposit balance should be equal 18").to.be.equal(10000000);

       		await timeTravel(SECONDS_IN_DAY * 365); //jump 1 year forward

			await this.bank.withdraw(1);
			bal = await this.token.balanceOf(accounts[0]);
			expect(bal.toNumber(),"token balance now expected to increase").to.be.equal(10511618);
		});

		it('testing deposit breaking', async function(){
			await this.bank.deposit(10000000,2);

			await timeTravel(SECONDS_IN_DAY * 10);

			await this.bank.withdraw(2);

			bal = await this.token.balanceOf(accounts[0]);
			expect(Number(bal),"token balance shouldn't change").to.be.equal(10000000);

		})
		
		it('testing withdraw reject', async function(){
			await this.bank.withdraw(1).should.be.rejectedWith(EVM_REVERT);
		})

	});


	describe('Bank credit functionality',  () => {
		beforeEach(async function (){
			await this.token.mint(this.bank.address,100000000000);
			// await this.token.approve(this.bank.address, 10000000);
		});

		it('testing credit requests', async function() {
			const bank = this.bank;

			await bank.createCreditRequest(1000,4,10).should.be.rejectedWith(EVM_REVERT);

			await bank.createCreditRequest(1000, 1, 10);

			expect(!(await bank.getApproval())).to.be.true;

			await bank.approveCreditRequest(accounts[0], false);

			expect(!(await bank.getApproval())).to.be.true;

			await bank.approveCreditRequest(accounts[0], true);

			expect((await bank.getApproval())).to.be.true;
		});

		it('testing take credit', async function() {
			const bank = this.bank;
			const token = this.token;

			await bank.takeCredit().should.be.rejectedWith(EVM_REVERT); //attempt to take credit without previous request

			await bank.createCreditRequest(1415, 1, 10);

			await bank.takeCredit().should.be.rejectedWith(EVM_REVERT); //attempt to take credit without approval

			await bank.approveCreditRequest(accounts[0], true);

			Number(await token.balanceOf(accounts[0])).should.be.equal(0);
			await bank.takeCredit();
			expect(Number(await token.balanceOf(accounts[0])),"must be equal ").to.be.equal(1415);
		});

		describe('testing pay off', async function(){

			beforeEach(async function (){
				await this.token.mint(this.bank.address,10000000000);
				await this.bank.createCreditRequest(1415000000, 1, 1000);
				await this.bank.approveCreditRequest(accounts[0], true);
				await this.bank.takeCredit();
			});

			// it('payed off after year', async function() {
			// 	const bank = this.bank;
			// 	const token = this.token;

			// 	await timeTravel(SECONDS_IN_DAY * 366);

			// 	await token.mint(accounts[0], 148575 - 141500);
			// 	await token.approve(this.bank.address, 148575);
			// 	let res = await bank.payOff();
			// 	expect(Number(await token.balanceOf(accounts[0])), "balance should be equal 0 now").to.be.equal(0);
			// });

			it('payed off after year', async function() {
				const bank = this.bank;
				const token = this.token;

				await timeTravel(SECONDS_IN_DAY *366);

				//1415000000 on 1 year - 1499900000

				await token.mint(accounts[0], 1499900000 - 1415000000);
				await token.approve(this.bank.address, 1499900000);
				
				await bank.payOff();

				expect(Number(await token.balanceOf(accounts[0])), "balance should be equal 0 now").to.be.equal(0);
			});

			it('payed off after 6 months', async function() {
				const bank = this.bank;
				const token = this.token;

				await timeTravel(SECONDS_IN_DAY * (6*30 + 3 ));

				//1415000000 on 6 months - 1456831664
				await token.mint(accounts[0], 1456831664 - 1415000000);
				await token.approve(this.bank.address, 1456831664);
				
				await bank.payOff();

				expect(Number(await token.balanceOf(accounts[0])), "balance should be equal 0 now").to.be.equal(0);
			});

			it('payed off after 4 year and 8 months', async function() {
				const bank = this.bank;
				const token = this.token;

				await timeTravel(SECONDS_IN_DAY *(4*366 + 8*30));

				await token.mint(accounts[0], 1857164946 - 1415000000);
				await token.approve(this.bank.address, 1857164946);
				
				await bank.payOff();

				expect(Number(await token.balanceOf(accounts[0])), "balance should be equal 0 now").to.be.equal(0);
			});

		});

		describe('testing delayed pay off', ()=>{

			beforeEach(async function(){
				await this.token.mint(this.bank.address,10000000000);
				await this.bank.createCreditRequest(1415000000, 1, 12);
				await this.bank.approveCreditRequest(accounts[0], true);
				await this.bank.takeCredit();
			});

			it('payed off with 5 days delay', async function() {
				const bank = this.bank;
				const token = this.token;

				await timeTravel(SECONDS_IN_DAY *(366 + 10));

				await token.mint(accounts[0], 1499900000 - 1415000000);
				await token.approve(this.bank.address, 2499900000);
				
				await bank.payOff();

				expect(Number(await token.balanceOf(accounts[0])), "balance should be equal 0 now").to.be.equal(0);
			});

			it('payed off with more than 1 month delay', async function() {
				const bank = this.bank;
				const token = this.token;

				await timeTravel(SECONDS_IN_DAY *(366 + 30));

				await token.mint(accounts[0], (1507200839+141500000) - 1415000000);
				await token.approve(this.bank.address, 1507200839+141500000);
				
				await bank.payOff();

				expect(Number(await token.balanceOf(accounts[0])), "balance should be equal 0 now").to.be.equal(0);
			});

		});

	});


})
