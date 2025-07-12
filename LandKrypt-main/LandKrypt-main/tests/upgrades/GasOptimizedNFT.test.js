// Gas Optimized NFT Tests
// Tests for enhanced NFT contract with gas optimizations and batch operations

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('GasOptimizedNFT', function () {
  async function deployNFTFixture() {
    const [owner, minter, user1, user2, royaltyRecipient] = await ethers.getSigners();

    const GasOptimizedNFT = await ethers.getContractFactory('GasOptimizedNFT');
    const nft = await GasOptimizedNFT.deploy(
      'LandKrypt Property',
      'LKPROP',
      owner.address
    );
    await nft.deployed();

    // Grant minter role
    const MINTER_ROLE = await nft.MINTER_ROLE();
    await nft.grantRole(MINTER_ROLE, minter.address);

    return {
      nft,
      owner,
      minter,
      user1,
      user2,
      royaltyRecipient,
      MINTER_ROLE
    };
  }

  describe('Basic NFT Functionality', function () {
    it('Should deploy with correct name and symbol', async function () {
      const { nft } = await loadFixture(deployNFTFixture);

      expect(await nft.name()).to.equal('LandKrypt Property');
      expect(await nft.symbol()).to.equal('LKPROP');
    });

    it('Should support required interfaces', async function () {
      const { nft } = await loadFixture(deployNFTFixture);

      // ERC721
      expect(await nft.supportsInterface('0x80ac58cd')).to.be.true;
      // ERC721Metadata
      expect(await nft.supportsInterface('0x5b5e139f')).to.be.true;
      // ERC721Enumerable
      expect(await nft.supportsInterface('0x780e9d63')).to.be.true;
      // ERC2981 (Royalty)
      expect(await nft.supportsInterface('0x2a55205a')).to.be.true;
    });
  });

  describe('Minting Functionality', function () {
    it('Should mint NFT with property data', async function () {
      const { nft, minter, user1 } = await loadFixture(deployNFTFixture);

      const propertyData = {
        price: ethers.utils.parseEther('2.5'), // 2.5 ETH
        propertyType: 1, // Villa
        location: 1, // Lagos
        rarity: 3, // Rare
        attributes: 0x1234, // Packed attributes
        timestamp: Math.floor(Date.now() / 1000)
      };

      const uri = 'ipfs://QmTestHash123';
      const royaltyFee = 250; // 2.5%

      const tx = await nft.connect(minter).mint(
        user1.address,
        uri,
        propertyData,
        royaltyFee
      );

      const receipt = await tx.wait();
      const tokenId = 0; // First token

      // Verify NFT was minted
      expect(await nft.ownerOf(tokenId)).to.equal(user1.address);
      expect(await nft.tokenURI(tokenId)).to.equal(uri);

      // Verify property data
      const storedData = await nft.getPropertyData(tokenId);
      expect(storedData.price).to.equal(propertyData.price);
      expect(storedData.propertyType).to.equal(propertyData.propertyType);
      expect(storedData.location).to.equal(propertyData.location);
      expect(storedData.rarity).to.equal(propertyData.rarity);

      // Verify royalty
      const royaltyInfo = await nft.royaltyInfo(tokenId, ethers.utils.parseEther('1'));
      expect(royaltyInfo[0]).to.equal(user1.address);
      expect(royaltyInfo[1]).to.equal(ethers.utils.parseEther('0.025')); // 2.5% of 1 ETH
    });

    it('Should emit PropertyMinted event', async function () {
      const { nft, minter, user1 } = await loadFixture(deployNFTFixture);

      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 2,
        location: 2,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await expect(
        nft.connect(minter).mint(user1.address, 'ipfs://test', propertyData, 0)
      ).to.emit(nft, 'PropertyMinted')
        .withArgs(0, user1.address, propertyData.price, propertyData.propertyType, propertyData.location, propertyData.rarity);
    });

    it('Should only allow minters to mint', async function () {
      const { nft, user1 } = await loadFixture(deployNFTFixture);

      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await expect(
        nft.connect(user1).mint(user1.address, 'ipfs://test', propertyData, 0)
      ).to.be.revertedWith('AccessControl: account missing role');
    });
  });

  describe('Batch Minting', function () {
    it('Should batch mint multiple NFTs efficiently', async function () {
      const { nft, minter, user1, user2 } = await loadFixture(deployNFTFixture);

      const batchData = [
        {
          to: user1.address,
          uri: 'ipfs://test1',
          propertyData: {
            price: ethers.utils.parseEther('1'),
            propertyType: 1,
            location: 1,
            rarity: 1,
            attributes: 0,
            timestamp: Math.floor(Date.now() / 1000)
          },
          royaltyFee: 250
        },
        {
          to: user2.address,
          uri: 'ipfs://test2',
          propertyData: {
            price: ethers.utils.parseEther('2'),
            propertyType: 2,
            location: 2,
            rarity: 2,
            attributes: 0,
            timestamp: Math.floor(Date.now() / 1000)
          },
          royaltyFee: 300
        }
      ];

      const tx = await nft.connect(minter).batchMint(batchData);
      const receipt = await tx.wait();

      // Verify both NFTs were minted
      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await nft.ownerOf(1)).to.equal(user2.address);

      // Verify property data
      const data1 = await nft.getPropertyData(0);
      const data2 = await nft.getPropertyData(1);

      expect(data1.price).to.equal(batchData[0].propertyData.price);
      expect(data2.price).to.equal(batchData[1].propertyData.price);

      // Check gas efficiency (batch should be more efficient than individual mints)
      console.log(`Batch mint gas used: ${receipt.gasUsed.toString()}`);
    });

    it('Should emit BatchMinted event', async function () {
      const { nft, minter, user1 } = await loadFixture(deployNFTFixture);

      const batchData = [{
        to: user1.address,
        uri: 'ipfs://test',
        propertyData: {
          price: ethers.utils.parseEther('1'),
          propertyType: 1,
          location: 1,
          rarity: 1,
          attributes: 0,
          timestamp: Math.floor(Date.now() / 1000)
        },
        royaltyFee: 0
      }];

      await expect(
        nft.connect(minter).batchMint(batchData)
      ).to.emit(nft, 'BatchMinted')
        .withArgs(user1.address, [0]);
    });

    it('Should enforce batch size limits', async function () {
      const { nft, minter, user1 } = await loadFixture(deployNFTFixture);

      // Create batch larger than limit (50)
      const largeBatch = Array(51).fill().map((_, i) => ({
        to: user1.address,
        uri: `ipfs://test${i}`,
        propertyData: {
          price: ethers.utils.parseEther('1'),
          propertyType: 1,
          location: 1,
          rarity: 1,
          attributes: 0,
          timestamp: Math.floor(Date.now() / 1000)
        },
        royaltyFee: 0
      }));

      await expect(
        nft.connect(minter).batchMint(largeBatch)
      ).to.be.revertedWith('Invalid batch size');
    });
  });

  describe('Batch Transfer', function () {
    it('Should batch transfer multiple NFTs', async function () {
      const { nft, minter, user1, user2 } = await loadFixture(deployNFTFixture);

      // Mint some NFTs first
      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://test1', propertyData, 0);
      await nft.connect(minter).mint(user1.address, 'ipfs://test2', propertyData, 0);

      // Batch transfer
      await nft.connect(user1).batchTransfer(user1.address, user2.address, [0, 1]);

      // Verify transfers
      expect(await nft.ownerOf(0)).to.equal(user2.address);
      expect(await nft.ownerOf(1)).to.equal(user2.address);
    });

    it('Should enforce batch transfer size limits', async function () {
      const { nft, user1, user2 } = await loadFixture(deployNFTFixture);

      const largeBatch = Array(21).fill().map((_, i) => i);

      await expect(
        nft.connect(user1).batchTransfer(user1.address, user2.address, largeBatch)
      ).to.be.revertedWith('Batch size too large');
    });
  });

  describe('Property Data Management', function () {
    it('Should get batch property data efficiently', async function () {
      const { nft, minter, user1 } = await loadFixture(deployNFTFixture);

      // Mint multiple NFTs
      const propertyData1 = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      const propertyData2 = {
        price: ethers.utils.parseEther('2'),
        propertyType: 2,
        location: 2,
        rarity: 2,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://test1', propertyData1, 0);
      await nft.connect(minter).mint(user1.address, 'ipfs://test2', propertyData2, 0);

      // Get batch data
      const batchData = await nft.getBatchPropertyData([0, 1]);

      expect(batchData[0].price).to.equal(propertyData1.price);
      expect(batchData[1].price).to.equal(propertyData2.price);
    });

    it('Should update property data (admin only)', async function () {
      const { nft, owner, minter, user1 } = await loadFixture(deployNFTFixture);

      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://test', propertyData, 0);

      const newData = {
        price: ethers.utils.parseEther('2'),
        propertyType: 2,
        location: 2,
        rarity: 2,
        attributes: 0x5678,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(owner).updatePropertyData(0, newData);

      const updatedData = await nft.getPropertyData(0);
      expect(updatedData.price).to.equal(newData.price);
      expect(updatedData.propertyType).to.equal(newData.propertyType);
    });
  });

  describe('On-chain Metadata Generation', function () {
    it('Should generate metadata on-chain', async function () {
      const { nft, minter, user1 } = await loadFixture(deployNFTFixture);

      const propertyData = {
        price: ethers.utils.parseEther('2.5'),
        propertyType: 1,
        location: 1,
        rarity: 3,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://test', propertyData, 0);

      const metadata = await nft.generateMetadata(0);
      
      // Should be base64 encoded JSON
      expect(metadata).to.include('data:application/json;base64,');
      
      // Decode and verify content
      const base64Data = metadata.split(',')[1];
      const jsonData = Buffer.from(base64Data, 'base64').toString();
      const parsedData = JSON.parse(jsonData);

      expect(parsedData.name).to.include('LandKrypt Property #0');
      expect(parsedData.attributes).to.be.an('array');
      expect(parsedData.attributes.length).to.be.greaterThan(0);
    });
  });

  describe('Tokens of Owner', function () {
    it('Should get paginated tokens of owner', async function () {
      const { nft, minter, user1 } = await loadFixture(deployNFTFixture);

      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Mint 5 NFTs
      for (let i = 0; i < 5; i++) {
        await nft.connect(minter).mint(user1.address, `ipfs://test${i}`, propertyData, 0);
      }

      // Get first 3 tokens
      const tokens1 = await nft.tokensOfOwner(user1.address, 0, 3);
      expect(tokens1.length).to.equal(3);
      expect(tokens1[0]).to.equal(0);
      expect(tokens1[1]).to.equal(1);
      expect(tokens1[2]).to.equal(2);

      // Get remaining tokens
      const tokens2 = await nft.tokensOfOwner(user1.address, 3, 3);
      expect(tokens2.length).to.equal(2);
      expect(tokens2[0]).to.equal(3);
      expect(tokens2[1]).to.equal(4);
    });
  });

  describe('Royalty Management', function () {
    it('Should set and get token royalties', async function () {
      const { nft, owner, minter, user1, royaltyRecipient } = await loadFixture(deployNFTFixture);

      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://test', propertyData, 250);

      // Update royalty
      await nft.connect(owner).setTokenRoyalty(0, royaltyRecipient.address, 500); // 5%

      const royaltyInfo = await nft.royaltyInfo(0, ethers.utils.parseEther('1'));
      expect(royaltyInfo[0]).to.equal(royaltyRecipient.address);
      expect(royaltyInfo[1]).to.equal(ethers.utils.parseEther('0.05')); // 5% of 1 ETH
    });

    it('Should set default royalty', async function () {
      const { nft, owner, royaltyRecipient } = await loadFixture(deployNFTFixture);

      await nft.connect(owner).setDefaultRoyalty(royaltyRecipient.address, 300); // 3%

      // This would affect new tokens without specific royalty settings
      const royaltyInfo = await nft.royaltyInfo(999, ethers.utils.parseEther('1')); // Non-existent token
      expect(royaltyInfo[0]).to.equal(royaltyRecipient.address);
      expect(royaltyInfo[1]).to.equal(ethers.utils.parseEther('0.03')); // 3% of 1 ETH
    });
  });

  describe('Gas Optimization Verification', function () {
    it('Should demonstrate gas savings in batch operations', async function () {
      const { nft, minter, user1 } = await loadFixture(deployNFTFixture);

      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Single mint gas usage
      const singleTx = await nft.connect(minter).mint(user1.address, 'ipfs://single', propertyData, 0);
      const singleReceipt = await singleTx.wait();
      const singleGas = singleReceipt.gasUsed;

      // Batch mint gas usage (5 NFTs)
      const batchData = Array(5).fill().map((_, i) => ({
        to: user1.address,
        uri: `ipfs://batch${i}`,
        propertyData,
        royaltyFee: 0
      }));

      const batchTx = await nft.connect(minter).batchMint(batchData);
      const batchReceipt = await batchTx.wait();
      const batchGas = batchReceipt.gasUsed;

      console.log(`Single mint gas: ${singleGas.toString()}`);
      console.log(`Batch mint (5) gas: ${batchGas.toString()}`);
      console.log(`Gas per NFT in batch: ${batchGas.div(5).toString()}`);
      console.log(`Gas savings: ${((singleGas.mul(5).sub(batchGas)).mul(100).div(singleGas.mul(5))).toString()}%`);

      // Batch should be more efficient
      expect(batchGas).to.be.lt(singleGas.mul(5));
    });
  });

  describe('Emergency Functions', function () {
    it('Should allow emergency withdrawal (admin only)', async function () {
      const { nft, owner, user1 } = await loadFixture(deployNFTFixture);

      // Send some ETH to contract
      await user1.sendTransaction({
        to: nft.address,
        value: ethers.utils.parseEther('1')
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await nft.connect(owner).emergencyWithdraw();
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
});
