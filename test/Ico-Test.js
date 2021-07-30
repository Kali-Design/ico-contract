/* eslint-disable comma-dangle */
/* eslint-disable no-undef */
const { expect } = require('chai');

describe('ICO', function () {
  let dev, ownerToken, ownerIco, Alice, Bob, Token, token, ICO, ico, cfg;
  const INITIAL_SUPPLY = ethers.utils.parseEther('1000000');
  const gwei = 10 ** 9;

  beforeEach(async function () {
    [dev, ownerToken, ownerIco, Alice, Bob] = await ethers.getSigners();
    Token = await ethers.getContractFactory('Token');
    token = await Token.connect(dev).deploy(ownerToken.address);
    await token.deployed();
    ICO = await ethers.getContractFactory('ICO');
    ico = await ICO.connect(ownerIco).deploy(token.address);
    await ico.deployed();
    await token.connect(ownerToken).approve(ico.address, INITIAL_SUPPLY);
  });
  describe('Deployment', function () { // Good
    it('Should revert ROT token if owner Token has no token', async function () { // Good
      await token.connect(ownerToken).transfer(Alice.address, INITIAL_SUPPLY); // Good
      await expect(ICO.connect(ownerIco).deploy(token.address)).to.be.revertedWith( // Good
        'ICO: The owner must have token ROT for exchange' // Good
      );
    });
  });

  describe('Buy function', function () { // Good
    it('Receive', async function () { // Good
      cfg = await Alice.sendTransaction({ to: ico.address, value: 2 * gwei }); // Good
      expect(await token.balanceOf(Alice.address)).to.equal(ethers.utils.parseEther('2')); // Good
      expect(await ico.total()).to.equal(2 * gwei); // Good
      expect(cfg).to.changeEtherBalance(Alice, -2 * gwei); // Good
    });
    it('Buy Tokens', async function () { // Good
      cfg = await ico.connect(Alice).buyTokens({ value: gwei }); // Good
      expect(await token.balanceOf(Alice.address)).to.equal(ethers.utils.parseEther('1')); // Good
      expect(await ico.total()).to.equal(gwei); // Good
      expect(cfg).to.changeEtherBalance(Alice, -gwei); // Good
    });
    it('Buy Token with refund', async function () { // Good
      await token.connect(ownerToken).approve(ico.address, ethers.utils.parseEther('1')); // Good
      cfg = await ico.connect(Alice).buyTokens({ value: 3 * gwei }); // Good
      expect(await ico.total()).to.equal(gwei); // Good
      expect(cfg).to.changeEtherBalance(Alice, -gwei); // Good
    });
    it('Should emit a Purchase event', async function () { // Good
      await expect(await ico.connect(Alice).buyTokens({ value: gwei })) // Good
        .to.emit(ico, 'Purchase') // Good
        .withArgs(Alice.address, gwei); // Good
    });
    it('TimeLock test', async function () { // Good
      await ethers.provider.send('evm_increaseTime', [60 * 60 * 24 * 14]); // Good
      await ethers.provider.send('evm_mine'); // Good
      await expect(ico.connect(Alice).buyTokens({ value: gwei })).to.be.revertedWith( // Good
        'ICO: 14 days have passed, you can not buy token' // Good
      );
    });
    it('Should revert if ICO has no allowance', async function () { // Good
      ico = await ICO.connect(ownerIco).deploy(token.address); // Good
      await ico.deployed(); // Good
      await expect(ico.connect(Alice).buyTokens({ value: gwei })).to.be.revertedWith( // Good
        'ICO: You have not approved because all token are already sold' // Good
      );
    });
  });

  describe('Withdraw', function () { // good
    beforeEach(async function () { // good
      await ico.connect(Alice).buyTokens({ value: 10 * gwei }); // good
      await ico.connect(Bob).buyTokens({ value: 100 * gwei }); // good
    });
    it('Should send contract balance to owner', async function () { // good
      await ethers.provider.send('evm_increaseTime', [60 * 60 * 24 * 14]); // good
      await ethers.provider.send('evm_mine'); // good
      expect(await ico.connect(ownerIco).withdraw()).to.changeEtherBalance(ownerIco, 110 * gwei); // good
      expect(await ico.total()).to.equal(0); // good
    });
    it('Should emit a Withdrew event', async function () { // good
      await ethers.provider.send('evm_increaseTime', [60 * 60 * 24 * 14]); // good
      await ethers.provider.send('evm_mine'); // good
      await expect(await ico.connect(ownerIco).withdraw()) // good
        .to.emit(ico, 'Withdrew') // good
        .withArgs(ownerIco.address, 110 * gwei); // good
    });
    it('Should revert if not owner', async function () { // good
      await expect(ico.connect(Alice).withdraw()).to.be.revertedWith('Ownable: caller is not the owner'); // good
    });
    it('Should revert if 14 days has not pass', async function () { // good
      await expect(ico.connect(ownerIco).withdraw()).to.be.revertedWith( // good
        'ICO: you need to wait 14 days from the deployment of this contract' // good
      );
    });
  });
});
