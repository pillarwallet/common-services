/*
Copyright (C) 2019 Stiftung Pillar Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
const { Contract, providers, Wallet } = require('ethers');
const { Badge, BadgeAward } = require('@pillarwallet/common-models').platform;
const logger = require('../utilities/logger');
const badgesAbi = require('./badgesAbi.json');

const WALLET_CREATED_BADGE_TYPE = 'wallet-created';
const WALLET_IMPORTED_BADGE_TYPE = 'wallet-imported';
const FIRST_CONNECTION_ESTABLISHED_BADGE_TYPE = 'first-connection-established';
// first-transaction-made
// first-transaction-received

const DEFAULT_TX_STATUS = 'pending';
const CONFIRMED_TX_STATUS = 'confirmed';
const FAILED_TX_STATUS = 'failed';
const BADGES_CONTRACT_ADDRESS = '0xe32e4DbA36675f1F2Fff3a02b399b0CF1D80EEe6';
const PRIVATE_KEY =
  'aca72b8c87d37c2defac84172e4082c403024fc4f38429cefb9f17eb4b28fbf0';

const getProvider = () =>
  new providers.JsonRpcProvider('http://localhost:8545');
// new providers.JsonRpcProvider('http://host.docker.internal:8545');

const getContract = () => {
  const provider = getProvider();
  return new Contract(BADGES_CONTRACT_ADDRESS, badgesAbi, provider);
};

const getContractWithSigner = () => {
  // connect to the smart contract
  logger.info('Attempting to connect to the badges smart contract');
  const provider = getProvider();
  const contract = getContract();
  const wallet = new Wallet(PRIVATE_KEY, provider);
  const contractWithSigner = contract.connect(wallet);
  return contractWithSigner;
};

const awardBadge = async (badgeEthereumId, userEthereumAddress) => {
  const contractWithSigner = getContractWithSigner();

  logger.info('Attempting to award a user with the badge');
  return contractWithSigner
    .awardToken(badgeEthereumId, userEthereumAddress, 1)
    .catch(e => {
      logger.error('An error occurred whilst trying to award user with badge');
      logger.error({
        ethereumId: badgeEthereumId,
        ethAddress: userEthereumAddress,
        amount: 1,
      });
      logger.error(e);
    });
};

const massBadgeAward = async (badgeEthereumId, usersEthereumAddresses) => {
  const contractWithSigner = getContractWithSigner();
  logger.info('Attempting to award users with the badge');
  return contractWithSigner
    .batchAwardToken(badgeEthereumId, usersEthereumAddresses, 1)
    .catch(e => {
      logger.error('An error occurred trying to mass award users with badge');
      logger.error({
        ethereumId: badgeEthereumId,
        ethAddresses: usersEthereumAddresses,
        amount: 1,
      });
      logger.error(e);
    });
};

const awardOnce = async (walletId, userId, ethAddress, badgeType) => {
  let badgeObject;
  let badgeAwardObject;

  // find badge by type
  logger.info(`Attempting to get the ${badgeType} badge object`);
  try {
    badgeObject = await Badge.findOne({ type: badgeType });
  } catch (e) {
    logger.error('An error occurred whilst getting a badge object');
    logger.error(e);
  }
  if (!badgeObject) return;

  // check if user was already awarded
  logger.info('Checking if our user was already awarded');
  try {
    badgeAwardObject = await BadgeAward.findOne({ badgeType, walletId });
  } catch (e) {
    logger.error('An error occurred whilst getting a BadgeAward object');
    logger.error(e);
    return;
  }
  if (badgeAwardObject && badgeAwardObject.txStatus === 'pending') {
    return { // eslint-disable-line
      error: 'Please wait until the transaction be mined',
    };
  }
  if (badgeAwardObject) {
    return { // eslint-disable-line
      error: 'You already have this badge',
    };
  }

  const tx = await awardBadge(badgeObject.ethereumId, ethAddress);
  if (!tx) return;

  // store the tx hash, set tx status to pending
  try {
    badgeAwardObject = await new BadgeAward({
      badge: badgeObject._id, // eslint-disable-line
      badgeType,
      userId,
      walletId,
      txStatus: DEFAULT_TX_STATUS,
      txHash: tx.hash,
    }).save();
  } catch (e) {
    logger.error('An error occurred whilst trying to create a BadgeAward:');
    logger.error({
      badge: badgeObject._id, // eslint-disable-line
      badgeType,
      userId,
      walletId,
      txStatus: DEFAULT_TX_STATUS,
      txHash: tx.hash,
    });
    logger.error(e);
  }
  if (badgeAwardObject) {
    logger.info('User was awarded with a badge');
  }
  return badgeAwardObject; // eslint-disable-line
};

const onUserRegistered = (walletId, userId, ethAddress) =>
  awardOnce(walletId, userId, ethAddress, WALLET_CREATED_BADGE_TYPE);

const onWalletImported = (walletId, userId, ethAddress) =>
  awardOnce(walletId, userId, ethAddress, WALLET_IMPORTED_BADGE_TYPE);

const onConnectionEstablished = (walletId, userId, ethAddress) =>
  awardOnce(
    walletId,
    userId,
    ethAddress,
    FIRST_CONNECTION_ESTABLISHED_BADGE_TYPE,
  );

const selfAward = (badgeType, walletId, userId, ethAddress) =>
  awardOnce(walletId, userId, ethAddress, badgeType);

const checkTxStatus = txHash => {
  const provider = getProvider();
  return provider
    .getTransactionReceipt(txHash)
    .then(receipt => {
      if (!receipt) return DEFAULT_TX_STATUS;
      return receipt.status ? CONFIRMED_TX_STATUS : FAILED_TX_STATUS;
    })
    .catch(() => DEFAULT_TX_STATUS);
};

const mintBadge = async (tokenSupply = 0, isTransferable = false) => {
  const contract = getContract();
  const contractWithSigner = getContractWithSigner();

  const ethereumId = (await contract.totalSupply()).toNumber();

  logger.info(`Attempting to mint a badge with id ${ethereumId}`);
  return contractWithSigner
    .mintToken(ethereumId, tokenSupply, isTransferable)
    .then(tx => ({
      txHash: tx.hash,
      ethereumId,
    }))
    .catch(e => {
      logger.error('An error occurred whilst trying to mint a badge');
      logger.error({ ethereumId });
      logger.error(e);
      return {};
    });
};

module.exports = {
  onUserRegistered,
  onWalletImported,
  onConnectionEstablished,
  selfAward,
  checkTxStatus,
  mintBadge,
  awardBadge,
  massBadgeAward,
};
