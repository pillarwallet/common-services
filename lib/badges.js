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
const buildLogger = require('../utilities/logger');
const badgesAbi = require('./badgesAbi.json');

const WALLET_CREATED_BADGE_TYPE = 'wallet-created';
const WALLET_IMPORTED_BADGE_TYPE = 'wallet-imported';
const FIRST_CONNECTION_ESTABLISHED_BADGE_TYPE = 'first-connection-established';
const FIRST_TRANSACTION_MADE_TYPE = 'first-transaction-made';
const FIRST_TRANSACTION_RECEIVED_TYPE = 'first-transaction-received';

const DEFAULT_TX_STATUS = 'pending';
const CONFIRMED_TX_STATUS = 'confirmed';
const FAILED_TX_STATUS = 'failed';

/**
 * @name Constructor
 * @description This is the constructor of the BadgeService instance.
 * It allows to set the Configuration keys:
 *
 * @param {String} [networkProvider] Set the network provider (mainnet, ropsten, localhost, docker-ganache)
 * @param {String} [smartContractAddress] Set the smart contract address
 * @param {String} [privateKey] Set the private key to operate with the contract
 * @param {String} [loggerPath] Specify the file path to which log records are written
 * @param {Boolean} [logToFile] Enables logging to a file and file rotation
 * @param {Object} [dbModels] Pass the Badge and BadgeAward mongoose objects
 *
 * @returns Object<BadgeService>
 */
module.exports = ({ networkProvider, smartContractAddress, privateKey, loggerPath, logToFile, dbModels = {} }) => {
  const logger = buildLogger({ path: loggerPath, logToFile });
  if (!networkProvider) throw new Error('networkProvider is not set');
  if (!smartContractAddress) throw new Error('smartContractAddress is not set');

  const getProvider = () => {
    if (networkProvider === 'localhost') {
      return new providers.JsonRpcProvider('http://localhost:8545');
    }
    if (networkProvider === 'docker-ganache') {
      return new providers.JsonRpcProvider('http://host.docker.internal:8545');
    }
    return providers.getDefaultProvider(networkProvider);
  };

  const getContract = () => {
    const provider = getProvider();
    return new Contract(smartContractAddress, badgesAbi, provider);
  };

  const getContractWithSigner = () => {
    if (!privateKey) throw new Error('privateKey is not set');
    // connect to the smart contract
    logger.info('Attempting to connect to the badges smart contract');
    const provider = getProvider();
    const contract = getContract();
    const wallet = new Wallet(privateKey, provider);
    const contractWithSigner = contract.connect(wallet);
    return contractWithSigner;
  };

  /**
   * @name awardBadge
   * @description Award ethereum address with a badge
   *
   * @param {Number} [badgeEthereumId] Badge ID in the smart contract
   * @param {String} [userEthereumAddress] Ethereum address to award
   *
   * @returns Promise<TransactionDetails>
   */
  const awardBadge = async (badgeEthereumId, userEthereumAddress) => {
    const contractWithSigner = getContractWithSigner();

    logger.info('Attempting to award a user with the badge');
    return contractWithSigner.awardToken(badgeEthereumId, userEthereumAddress, 1).catch(e => {
      logger.error('An error occurred whilst trying to award user with badge');
      logger.error({
        ethereumId: badgeEthereumId,
        ethAddress: userEthereumAddress,
        amount: 1,
      });
      logger.error(e);
    });
  };

  /**
   * @name massBadgeAward
   * @description Award multiple ethereum addresses with a badge
   *
   * @param {Number} [badgeEthereumId] Badge ID in the smart contract
   * @param {String} [usersEthereumAddresses] Ethereum addresses to award
   *
   * @returns Promise<TransactionDetails>
   */
  const massBadgeAward = async (badgeEthereumId, usersEthereumAddresses) => {
    const contractWithSigner = getContractWithSigner();
    logger.info('Attempting to award users with the badge');
    return contractWithSigner.batchAwardToken(badgeEthereumId, usersEthereumAddresses, 1).catch(e => {
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
    const { Badge, BadgeAward } = dbModels;
    if (!Badge) throw new Error('Badge model is not provided');
    if (!BadgeAward) throw new Error('BadgeAward model is not provided');

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

  /**
   * @name onUserRegistered
   * @description Method that awards user with a badge for the registration
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   * @param {String} [ethAddress] User's Ethereum address
   *
   * @returns Promise<MongoDBObject>
   */
  const onUserRegistered = (walletId, userId, ethAddress) =>
    awardOnce(walletId, userId, ethAddress, WALLET_CREATED_BADGE_TYPE);

  /**
   * @name onWalletImported
   * @description Method that awards user with a badge for the imported wallet
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   * @param {String} [ethAddress] User's Ethereum address
   *
   * @returns Promise<MongoDBObject>
   */
  const onWalletImported = (walletId, userId, ethAddress) =>
    awardOnce(walletId, userId, ethAddress, WALLET_IMPORTED_BADGE_TYPE);

  /**
   * @name onConnectionEstablished
   * @description Method that awards user with a badge for the first connection
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   * @param {String} [ethAddress] User's Ethereum address
   *
   * @returns Promise<MongoDBObject>
   */
  const onConnectionEstablished = (walletId, userId, ethAddress) =>
    awardOnce(walletId, userId, ethAddress, FIRST_CONNECTION_ESTABLISHED_BADGE_TYPE);

  /**
   * @name onTransactionMade
   * @description Method that awards user with a badge for the first transaction made
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   * @param {String} [ethAddress] User's Ethereum address
   *
   * @returns Promise<MongoDBObject>
   */
  const onTransactionMade = (walletId, userId, ethAddress) =>
    awardOnce(walletId, userId, ethAddress, FIRST_TRANSACTION_MADE_TYPE);

  /**
   * @name onTransactionReceived
   * @description Method that awards user with a badge for the first transaction received
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   * @param {String} [ethAddress] User's Ethereum address
   *
   * @returns Promise<MongoDBObject>
   */
  const onTransactionReceived = (walletId, userId, ethAddress) =>
    awardOnce(walletId, userId, ethAddress, FIRST_TRANSACTION_RECEIVED_TYPE);

  /**
   * @name selfAward
   * @description Method to award yourself with a badge
   *
   * @param {String} [badgeType] Badge name
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   * @param {String} [ethAddress] User's Ethereum address
   *
   * @returns Promise<MongoDBObject>
   */
  const selfAward = (badgeType, walletId, userId, ethAddress) => awardOnce(walletId, userId, ethAddress, badgeType);

  /**
   * @name checkTxStatus
   * @description Get transaction status
   *
   * @param {String} [txHash] Transaction hash that you want to check
   *
   * @returns Promise<TransactionStatus>
   */
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

  /**
   * @name mintBadge
   * @description Mint a badge
   *
   * @param {Number} [tokenSupply - default 0] Maximum supply of a new badge, set 0 for unlimited
   * @param {Boolean} [isTransferable - default false] Specify if a user could transfer this badge to other users
   *
   * @returns Promise<TransactionDetails>
   */
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

  return {
    onUserRegistered,
    onWalletImported,
    onConnectionEstablished,
    onTransactionMade,
    onTransactionReceived,
    selfAward,
    checkTxStatus,
    mintBadge,
    awardBadge,
    massBadgeAward,
  };
};
