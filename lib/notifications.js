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
const AMQP = require('@pillarwallet/common-mq');
const aws = require('aws-sdk');
const cron = require('cron');
const buildLogger = require('../utilities/logger');
const types = require('../utilities/badgesTypes');

/**
 * @name Constructor
 * @description This is the constructor of the NotificationService instance.
 *
 * @param {Object} [sqsConfiguration] SQS configuration object
 * @param {Object} [mqConfiguration] MQ configuration object
 * @param {Object} [dbModels] Pass the Badge mongoose object
 * @param {Boolean} [queueUrl] The destination queue url
 * @param {Boolean} [pingMessage] Flag that indicates if ping message to MQ is needed
 *
 * @returns Object<NotificationService>
 */
module.exports = ({ sqsConfiguration = {}, mqConfiguration = {}, dbModels = {}, queueUrl, pingMessage }) => {
  let MQ;
  let pingMQ;

  const { topic, protocol, hostname, port, username, password, vhost, exchange } = mqConfiguration;

  // eslint-disable-next-line prettier/prettier
  if (!topic || !protocol || !hostname || !port || !username || !password || !vhost || !exchange) {
    throw new Error('Missing MQ configuration');
  }

  if (!queueUrl) {
    throw new Error('Missing queue url');
  }

  const logger = buildLogger({});

  const sqs = new aws.SQS(sqsConfiguration);

  /**
   * @name connectToMq
   * @description Set up connection to MQ, topic and events
   */
  const connectToMq = () => {
    /**
     * Instantiate a new AMQP instance
     */
    MQ = new AMQP({ locale: 'en_US', frameMax: 0, heartbeat: 1, ...mqConfiguration }, mqConfiguration.topic, {
      consume: false,
      acknowledge: false,
    });

    /**
     * Bind "error" event
     */
    MQ.on('error', err => {
      logger.error({ err }, `Common-Services: 🛑 MQ Connection Error for topic: ${mqConfiguration.topic}`);

      setTimeout(() => {
        connectToMq();
      }, 5000);
    });

    /**
     * Bind "message" event
     */
    MQ.on('message', msg => {
      logger.debug(`Message: ${JSON.stringify(msg)}`);
    });

    /**
     * Bind "system" event
     */
    MQ.on('system', () => {
      logger.info(`Common-Services: ✅ connected to MQ! topic: ${mqConfiguration.topic}`);
    });
  };

  /**
   * @name pingMqConnect
   * @description Set up connection to MQ, topic and events
   */
  const pingMqConnect = () => {
    /**
     * Instantiate a new AMQP instance
     */
    pingMQ = new AMQP({ locale: 'en_US', frameMax: 0, heartbeat: 1, ...mqConfiguration }, 'ping', {
      consume: false,
      acknowledge: false,
    });

    /**
     * Bind "error" event
     */
    pingMQ.on('error', err => {
      logger.error({ err }, 'Common-Services: 🛑 MQ Connection Error for topic: ping');

      setTimeout(() => {
        pingMqConnect();
      }, 5000);
    });

    /**
     * Bind "system" event
     */
    pingMQ.on('system', systemMessage => {
      if (systemMessage.queue === 'ping') {
        logger.info('Common-Services: ✅ Connected to MQ! topic: ping');
      }
    });
  };

  /**
   * @name pingMqMessage
   * @description a small function that simply constructs the message to be pushed to the topic.
   */
  const pingMqMessage = () => {
    const message = {
      type: 'ping',
      meta: {},
      payload: {},
    };

    if (pingMQ) {
      pingMQ.pushToTopic(JSON.stringify(message));
    }
  };

  connectToMq();

  if (pingMessage) {
    pingMqConnect();

    /**
     * Instantiate node-cron schedule to run
     * every minute.
     */
    const cronJob = new cron.CronJob({
      cronTime: '* * * * *',
      onTick: () => {
        pingMqMessage();
      },
      start: true,
      timeZone: 'UTC',
      context: null,
      runOnInit: true,
    });

    logger.info(`Common-Services: ⚙️ Job running: ${cronJob.running}`);
  }

  /**
   * @name pushToTopic
   * @description Method to send a message to MQ
   *
   * @param {Object} [message] The message object
   */
  const pushToTopic = message => MQ.pushToTopic(JSON.stringify(message));

  /**
   * @name retryMessage
   * @description Method to log error and call method sendMessage if corresponds
   */
  const retryMessage = (message, retry, err) => {
    logger.error({ err }, 'An error ocurred attempting to send a meesage to SQS');
    if (retry) {
      logger.info('Attempting to send message again...');
      sendMessage(message, false);
    }
  };

  /**
   * @name sendMessage
   * @description Method to send a message to SQS
   *
   * @param {Object} [message] The message object
   * @param {Boolean} [retry] Flag to indicate if the method should send the message again if we have an error
   */
  const sendMessage = (message, retry = true) => {
    const params = {
      MessageBody: JSON.stringify(message),
      QueueUrl: queueUrl,
      MessageGroupId: 'notificationsGroup',
    };

    // Send the message to SQS
    try {
      const sqsPromise = sqs.sendMessage(params).promise();
      sqsPromise
        .then(() => {
          logger.info('Message sent to SQS');
        })
        .catch(err => {
          retryMessage(message, retry, err);
        });
    } catch (err) {
      retryMessage(message, retry, err);
    }

    // Then send the message to mq, only in the first attempt
    if (retry) {
      try {
        pushToTopic(message);
        logger.info('Message sent to MQ');
      } catch (err) {
        logger.error({ err }, 'An error ocurred attempting to send a meesage to MQ');
      }
    }
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

    sendMessage(notification);
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

  return {
    sendMessage,
    createBadgesNotification,
    onUserRegisteredBadgeNotification,
    onWalletImportedBadgeNotification,
    onConnectionEstablishedBadgeNotification,
    onTransactionMadeBadgeNotification,
    onTransactionReceivedBadgeNotification,
  };
};
