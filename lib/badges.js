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
const buildLogger = require('../utilities/logger');
const types = require('../utilities/badgesTypes');

const CONFIRMED_TX_STATUS = 'confirmed';

/**
 * @name Constructor
 * @description This is the constructor of the BadgeService instance.
 * It allows to set the Configuration keys:
 *
 * @param {String} [loggerPath] Specify the file path to which log records are written
 * @param {Boolean} [logToFile] Enables logging to a file and file rotation
 * @param {Object} [dbModels] Pass the Badge and BadgeAward mongoose objects
 *
 * @returns Object<BadgeService>
 */
module.exports = ({ loggerPath = '', logToFile = false, dbModels = {} }) => {
  const logger = buildLogger({ path: loggerPath, logToFile });

  const { Badge, BadgeAward } = dbModels;

  if (!Badge) throw new Error('Badge model is not provided');
  if (!BadgeAward) throw new Error('BadgeAward model is not provided');

  const awardOnce = async (walletId, userId, badgeType) => {
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

    if (badgeAwardObject) {
      return { // eslint-disable-line
        error: 'You already have this badge',
      };
    }

    // store the badge award as confirmed
    try {
      badgeAwardObject = await new BadgeAward({
        badge: badgeObject._id, // eslint-disable-line
        badgeType,
        userId,
        walletId,
        txStatus: CONFIRMED_TX_STATUS,
        txHash: '',
      }).save();
    } catch (e) {
      logger.error('An error occurred whilst trying to create a BadgeAward:');
      logger.error({
        badge: badgeObject._id, // eslint-disable-line
        badgeType,
        userId,
        walletId,
        txStatus: CONFIRMED_TX_STATUS,
        txHash: '',
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
   *
   * @returns Promise<MongoDBObject>
   */
  const onUserRegistered = (walletId, userId) => awardOnce(walletId, userId, types.WALLET_CREATED_BADGE_TYPE);

  /**
   * @name onWalletImported
   * @description Method that awards user with a badge for the imported wallet
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   *
   * @returns Promise<MongoDBObject>
   */
  const onWalletImported = (walletId, userId) => awardOnce(walletId, userId, types.WALLET_IMPORTED_BADGE_TYPE);

  /**
   * @name onConnectionEstablished
   * @description Method that awards user with a badge for the first connection
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   *
   * @returns Promise<MongoDBObject>
   */
  const onConnectionEstablished = (walletId, userId) =>
    awardOnce(walletId, userId, types.FIRST_CONNECTION_ESTABLISHED_BADGE_TYPE);

  /**
   * @name onTransactionMade
   * @description Method that awards user with a badge for the first transaction made
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   *
   * @returns Promise<MongoDBObject>
   */
  const onTransactionMade = (walletId, userId) => awardOnce(walletId, userId, types.FIRST_TRANSACTION_MADE_TYPE);

  /**
   * @name onTransactionReceived
   * @description Method that awards user with a badge for the first transaction received
   *
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   *
   * @returns Promise<MongoDBObject>
   */
  const onTransactionReceived = (walletId, userId) =>
    awardOnce(walletId, userId, types.FIRST_TRANSACTION_RECEIVED_TYPE);

  /**
   * @name selfAward
   * @description Method to award yourself with a badge
   *
   * @param {String} [badgeType] Badge name
   * @param {String} [walletId] Wallet ID
   * @param {String} [userId] User ID
   *
   * @returns Promise<MongoDBObject>
   */
  const selfAward = (badgeType, walletId, userId) => awardOnce(walletId, userId, badgeType);

  return {
    onUserRegistered,
    onWalletImported,
    onConnectionEstablished,
    onTransactionMade,
    onTransactionReceived,
    selfAward,
  };
};
