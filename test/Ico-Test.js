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
  describe('Deployment', function () { 
    it('Should revert ROT token if owner Token has no token', async function () { 
      await token.connect(ownerToken).transfer(Alice.address, INITIAL_SUPPLY);
      await expect(ICO.connect(ownerIco).deploy(token.address)).to.be.revertedWith(
        'ICO: The owner must have token ROT for exchange' 
      );
    });
  });

  describe('Buy function', function () { 
    it('Receive', async function () { 
      cfg = await Alice.sendTransaction({ to: ico.address, value: 2 * gwei }); 
      expect(await token.balanceOf(Alice.address)).to.equal(ethers.utils.parseEther('2'));
      expect(await ico.total()).to.equal(2 * gwei); 
      expect(cfg).to.changeEtherBalance(Alice, -2 * gwei);
    });
    it('Buy Tokens', async function () { 
      cfg = await ico.connect(Alice).buyTokens({ value: gwei }); 
      expect(await token.balanceOf(Alice.address)).to.equal(ethers.utils.parseEther('1')); 
      expect(await ico.total()).to.equal(gwei); 
      expect(cfg).to.changeEtherBalance(Alice, -gwei); 
    });
    it('Buy Token with refund', async function () { 
      await token.connect(ownerToken).approve(ico.address, ethers.utils.parseEther('1')); 
      cfg = await ico.connect(Alice).buyTokens({ value: 3 * gwei }); 
      expect(await ico.total()).to.equal(gwei); 
      expect(cfg).to.changeEtherBalance(Alice, -gwei); 
    });
    it('Should emit a Purchase event', async function () { 
      await expect(await ico.connect(Alice).buyTokens({ value: gwei })) 
        .to.emit(ico, 'Purchase') 
        .withArgs(Alice.address, gwei);
    });
    it('TimeLock test', async function () { 
      await ethers.provider.send('evm_increaseTime', [60 * 60 * 24 * 14]);
      await ethers.provider.send('evm_mine');
      await expect(ico.connect(Alice).buyTokens({ value: gwei })).to.be.revertedWith( 
        'ICO: 14 days have passed, you can not buy token' 
      );
    });
    it('Should revert if ICO has no allowance', async function () { 
      ico = await ICO.connect(ownerIco).deploy(token.address);
      await ico.deployed(); 
      await expect(ico.connect(Alice).buyTokens({ value: gwei })).to.be.revertedWith( 
        'ICO: You have not approved because all token are already sold' 
      );
    });
  });

  describe('Withdraw', function () { 
    beforeEach(async function () { 
      await ico.connect(Alice).buyTokens({ value: 10 * gwei }); 
      await ico.connect(Bob).buyTokens({ value: 100 * gwei }); 
    });
    it('Should send contract balance to owner', async function () { 
      await ethers.provider.send('evm_increaseTime', [60 * 60 * 24 * 14]); 
      await ethers.provider.send('evm_mine'); // good
      expect(await ico.connect(ownerIco).withdraw()).to.changeEtherBalance(ownerIco, 110 * gwei); 
      expect(await ico.total()).to.equal(0); 
    });
    it('Should emit a Withdrew event', async function () { 
      await ethers.provider.send('evm_increaseTime', [60 * 60 * 24 * 14]); 
      await ethers.provider.send('evm_mine'); 
      await expect(await ico.connect(ownerIco).withdraw()) 
        .to.emit(ico, 'Withdrew') 
        .withArgs(ownerIco.address, 110 * gwei); 
    });
    it('Should revert if not owner', async function () { 
      await expect(ico.connect(Alice).withdraw()).to.be.revertedWith('Ownable: caller is not the owner');
    });
    it('Should revert if 14 days has not pass', async function () {
      await expect(ico.connect(ownerIco).withdraw()).to.be.revertedWith( 
        'ICO: you need to wait 14 days from the deployment of this contract'
      );
    });
  });
});
