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
const cron = require('cron');
const AMQP = require('@pillarwallet/common-mq');
const buildLogger = require('../utilities/logger');
const types = require('../utilities/badgesTypes');

/**
 * @name Constructor
 * @description This is the constructor of the NotificationService instance.
 *
 * @param {Object} [mqConfiguration] MQ configuration object
 * @param {Boolean} [pingMessage] Flag that indicates if ping message to MQ is needed
 *
 * @returns Object<NotificationService>
 */
module.exports = ({ mqConfiguration = {}, pingMessage }) => {
  let MQ;
  let pingMQ;

  const { topic, protocol, hostname, port, username, password, vhost, exchange } = mqConfiguration;

  // eslint-disable-next-line prettier/prettier
  if (!topic || !protocol || !hostname || !port || !username || !password || !vhost || !exchange) {
    throw new Error('Missing MQ configuration');
  }

  const logger = buildLogger({});

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
    pingMQ.on('system', () => {
      logger.info('Common-Services: ✅ Connected to MQ! topic: ping');
    });
  };

  /**
   * @name pingMqMessage
   * @description a small function that simply constructs the message
   * to be pushed to the topic.
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
   * @name createBadgesNotification
   * @description Method that creates a Badge notification and put the message in MQ
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const createBadgesNotification = async (wallet, type) => {
    const notification = {
      type: 'badgeAwardConfirmationEvent',
      meta: {
        recipientWalletData: wallet,
        recipientWalletId: wallet.id,
      },
      payload: {
        toAddress: wallet.ethAddress,
        status: 'confirmed',
        badgeType: type,
      },
    };

    pushToTopic(notification);
  };

  /**
   * @name onUserRegisteredNotification
   * @description Method that creates badge notification with type: wallet-created
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onUserRegisteredNotification = wallet => createBadgesNotification(wallet, types.WALLET_CREATED_BADGE_TYPE);

  /**
   * @name onWalletImportedNotification
   * @description Method that creates badge notification with type: wallet-imported
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onWalletImportedNotification = wallet => createBadgesNotification(wallet, types.WALLET_IMPORTED_BADGE_TYPE);

  /**
   * @name onConnectionEstablishedNotification
   * @description Method that creates badge notification with type: first-connection-established
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onConnectionEstablishedNotification = wallet =>
    createBadgesNotification(wallet, types.FIRST_CONNECTION_ESTABLISHED_BADGE_TYPE);

  /**
   * @name onTransactionMadeNotification
   * @description Method that creates badge notification with type: first-transaction-made
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onTransactionMadeNotification = wallet => createBadgesNotification(wallet, types.FIRST_TRANSACTION_MADE_TYPE);

  /**
   * @name onTransactionReceivedNotification
   * @description Method that creates badge notification with type: first-transaction-received
   *
   * @param {Object} [wallet] The wallet object from the recipient user
   */
  const onTransactionReceivedNotification = wallet =>
    createBadgesNotification(wallet, types.FIRST_TRANSACTION_RECEIVED_TYPE);

  return {
    pushToTopic,
    createBadgesNotification,
    onUserRegisteredNotification,
    onWalletImportedNotification,
    onConnectionEstablishedNotification,
    onTransactionMadeNotification,
    onTransactionReceivedNotification,
  };
};
