require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();
const { ALCHEMY_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;
module.exports = {
  solidity: { version: '0.8.24', settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    sepolia: {
      url: ALCHEMY_RPC_URL || '',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111
    },
    localhost: {
      url: process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 31337
    }
  },
  etherscan: { apiKey: ETHERSCAN_API_KEY || '' }
};
