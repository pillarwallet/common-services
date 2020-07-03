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
/* eslint-disable no-use-before-define */
const aws = require('aws-sdk');
const buildLogger = require('../utilities/logger');
const types = require('../utilities/badgesTypes');

/**
 * @name Constructor
 * @description This is the constructor of the NotificationService instance.
 *
 * @param {Object} [sqsConfiguration] SQS configuration object
 * @param {Object} [dbModels] Pass the Badge mongoose object
 *
 * @returns Object<NotificationService>
 */
module.exports = ({ sqsConfiguration = {}, dbModels = {} }) => {
  const { queueUrl, region, fifoQueue = true } = sqsConfiguration;

  if (!queueUrl) {
    throw new Error('Missing queue url');
  }

  const logger = buildLogger({});
  const sqs = new aws.SQS({ region });

  /**
   * @name retryMessage
   * @description Method to log error and call method sendMessage if corresponds
   */
  const retryMessage = (message, retry, err) => {
    logger.error({ err }, 'An error ocurred attempting to send a meesage to SQS');
    if (retry) {
      logger.info('Attempting to send message to SQS again...');
      sendMessage(message, false);
    }
  };

  /**
   * @name sendMessage
   * @description Method to send a message to SQS
   * @param {Object} [message] The message object
   */
  const sendMessage = async (message, retry = true) => {
    const params = {
      MessageBody: JSON.stringify(message),
      QueueUrl: queueUrl,
    };

    if (fifoQueue) {
      params.MessageGroupId = 'notificationsGroup';
    }

    const sqsPromise = sqs.sendMessage(params).promise();
    sqsPromise
      .then(() => {
        logger.info('✅ Message successfully sent to SQS!');
      })
      .catch(err => {
        retryMessage(message, retry, err);
      });
  };

  /**
   * @name createBadgesNotification
   * @description Method that creates a Badge notification and put the message in SQS
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const createBadgesNotification = async (wallet, type) => {
    const { Badge } = dbModels;
    if (!Badge) throw new Error('Badge model is not provided');

    let badgeObject;

    logger.info(`Attempting to get the ${type} badge object`);

    try {
      badgeObject = await Badge.findOne({ type });
    } catch (err) {
      logger.error({ err }, 'An error occurred whilst getting a badge object');
    }
    if (!badgeObject) {
      logger.error('Could not find Badge');
      return;
    }

    const notification = {
      type: 'badgeAwardConfirmationEvent',
      meta: {
        recipientWalletData: wallet,
        recipientWalletId: wallet.id,
      },
      payload: {
        id: badgeObject.id,
        toAddress: wallet.ethAddress,
        status: 'confirmed',
        badgeType: type,
        name: badgeObject.name,
        imageUrl: badgeObject.imageUrl,
      },
    };

    await sendMessage(notification);
  };

  /**
   * @name onUserRegisteredBadgeNotification
   * @description Method that creates badge notification with type: wallet-created
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onUserRegisteredBadgeNotification = wallet => createBadgesNotification(wallet, types.WALLET_CREATED_BADGE_TYPE);

  /**
   * @name onWalletImportedBadgeNotification
   * @description Method that creates badge notification with type: wallet-imported
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onWalletImportedBadgeNotification = wallet =>
    createBadgesNotification(wallet, types.WALLET_IMPORTED_BADGE_TYPE);

  /**
   * @name onConnectionEstablishedBadgeNotification
   * @description Method that creates badge notification with type: first-connection-established
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onConnectionEstablishedBadgeNotification = wallet =>
    createBadgesNotification(wallet, types.FIRST_CONNECTION_ESTABLISHED_BADGE_TYPE);

  /**
   * @name onTransactionMadeBadgeNotification
   * @description Method that creates badge notification with type: first-transaction-made
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onTransactionMadeBadgeNotification = wallet =>
    createBadgesNotification(wallet, types.FIRST_TRANSACTION_MADE_TYPE);

  /**
   * @name onTransactionReceivedBadgeNotification
   * @description Method that creates badge notification with type: first-transaction-received
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onTransactionReceivedBadgeNotification = wallet =>
    createBadgesNotification(wallet, types.FIRST_TRANSACTION_RECEIVED_TYPE);

  /**
   * @name onEmailVerifiedBadgeNotification
   * @description Method that creates badge notification with type: email-verified
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   *
   * @returns Promise<MongoDBObject>
   */
  const onEmailVerifiedBadgeNotification = wallet => createBadgesNotification(wallet, types.EMAIL_VERIFIED_TYPE);

  /**
   * @name onPhoneVerifiedBadgeNotification
   * @description Method that creates badge notification with type: phone-verified
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   *
   * @returns Promise<MongoDBObject>
   */
  const onPhoneVerifiedBadgeNotification = wallet => createBadgesNotification(wallet, types.PHONE_VERIFIED_TYPE);

  /**
   * @name onReferralRewardReceivedBadgeNotification
   * @description Method that creates badge notification with type: referral-reward-received
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   *
   * @returns Promise<MongoDBObject>
   */
  const onReferralRewardReceivedBadgeNotification = wallet =>
    createBadgesNotification(wallet, types.REFERRAL_REWARD_RECEIVED_TYPE);

  /**
   * @name onFirstReferralSentBadgeNotification
   * @description Method that creates badge notification with type: first-referral-sent
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   *
   * @returns Promise<MongoDBObject>
   */
  const onFirstReferralSentBadgeNotification = wallet =>
    createBadgesNotification(wallet, types.FIRST_REFERRAL_SENT_TYPE);

  /**
   * @name onFirstAaveDepositBadgeNotification
   * @description Method that creates badge notification with type: first-aave-deposit
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   *
   * @returns Promise<MongoDBObject>
   */
  const onFirstAaveDepositBadgeNotification = wallet => createBadgesNotification(wallet, types.FIRST_AAVE_DEPOSIT);

  return {
    sendMessage,
    createBadgesNotification,
    onUserRegisteredBadgeNotification,
    onWalletImportedBadgeNotification,
    onConnectionEstablishedBadgeNotification,
    onTransactionMadeBadgeNotification,
    onTransactionReceivedBadgeNotification,
    onEmailVerifiedBadgeNotification,
    onPhoneVerifiedBadgeNotification,
    onReferralRewardReceivedBadgeNotification,
    onFirstReferralSentBadgeNotification,
    onFirstAaveDepositBadgeNotification,
  };
};
