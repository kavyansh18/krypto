require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/bMfP5FV7hnuESNdEnzWWXe7V-k7QVqKI", 
      accounts: ['46ed9b7aca976b8d1e4f275646021c8c34d72d8e505d864f7e5e6f615ceb7487']
    },
  },
};
