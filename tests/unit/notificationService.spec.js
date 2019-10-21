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

const buildNotificationService = require('../../lib/notifications');

jest.mock('cron');
jest.mock('@pillarwallet/common-mq');

describe('Notification Service', () => {
  let mqConfiguration;

  const expectedPingMessage = {
    type: 'ping',
    meta: {},
    payload: {},
  };

  beforeEach(() => {
    mqConfiguration = {
      topic: 'topic',
      protocol: 'protocol',
      hostname: 'hostname',
      port: 'port',
      username: 'username',
      password: 'password',
      vhost: 'vhost',
      exchange: 'exchange',
    };

    jest.spyOn(cron, 'CronJob').mockImplementation(() => jest.fn());
  });

  afterEach(() => {
    cron.CronJob.mockClear();
    AMQP.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return the Notification Service instance', () => {
    const NotificationService = buildNotificationService({
      mqConfiguration,
      pingMessage: false,
    });

    expect(typeof NotificationService.pushToTopic).toBe('function');
    expect(typeof NotificationService.createBadgesNotification).toBe('function');
    expect(typeof NotificationService.onUserRegisteredBadgeNotification).toBe('function');
    expect(typeof NotificationService.onWalletImportedBadgeNotification).toBe('function');
    expect(typeof NotificationService.onConnectionEstablishedBadgeNotification).toBe('function');
    expect(typeof NotificationService.onTransactionMadeBadgeNotification).toBe('function');
    expect(typeof NotificationService.onTransactionReceivedBadgeNotification).toBe('function');
  });

  it('should fail on invalid params', () => {
    expect(() => buildNotificationService({ mqConfiguration: {}, pingMessage: false })).toThrowError(
      new TypeError('Missing MQ configuration'),
    );
  });

  it('should have called the node-cron scheduler function if pingMessage is true', async () => {
    buildNotificationService({ mqConfiguration, pingMessage: true });

    expect(cron.CronJob).toHaveBeenCalledWith({
      cronTime: '* * * * *',
      onTick: expect.any(Function),
      start: true,
      timeZone: 'UTC',
      context: null,
      runOnInit: true,
    });
  });

  it('should not have called the node-cron scheduler function if pingMessage is false', async () => {
    buildNotificationService({ mqConfiguration, pingMessage: false });
    expect(cron.CronJob).not.toBeCalled();
  });

  it('should have instantiated a new MQ with the correct config options', () => {
    buildNotificationService({ mqConfiguration, pingMessage: false });

    const amqpCallParameter1 = AMQP.mock.calls[0][0];
    const amqpCallParameter2 = AMQP.mock.calls[0][1];
    const amqpCallParameter3 = AMQP.mock.calls[0][2];

    expect(amqpCallParameter1).toEqual({ locale: 'en_US', frameMax: 0, heartbeat: 1, ...mqConfiguration });
    expect(amqpCallParameter2).toBe('topic');
    expect(amqpCallParameter3).toEqual({
      consume: false,
      acknowledge: false,
    });
  });

  it('should have instantiated a new MQ with the correct config options and override default configuration', () => {
    mqConfiguration = {
      topic: 'topic',
      protocol: 'protocol',
      hostname: 'hostname',
      port: 'port',
      username: 'username',
      password: 'password',
      vhost: 'vhost',
      exchange: 'exchange',
      frameMax: 1,
      heartbeat: 2,
    };
    buildNotificationService({ mqConfiguration, pingMessage: false });
    const amqpCallParameter1 = AMQP.mock.calls[0][0];
    const amqpCallParameter2 = AMQP.mock.calls[0][1];
    const amqpCallParameter3 = AMQP.mock.calls[0][2];

    expect(amqpCallParameter1).toEqual({ locale: 'en_US', ...mqConfiguration });
    expect(amqpCallParameter2).toBe('topic');
    expect(amqpCallParameter3).toEqual({
      consume: false,
      acknowledge: false,
    });
  });

  it('should have instantiated a new MQ with the correct config options, PING', () => {
    buildNotificationService({ mqConfiguration, pingMessage: true });
    const amqpCallParameter1 = AMQP.mock.calls[1][0];
    const amqpCallParameter2 = AMQP.mock.calls[1][1];
    const amqpCallParameter3 = AMQP.mock.calls[1][2];

    expect(amqpCallParameter1).toEqual({ locale: 'en_US', frameMax: 0, heartbeat: 1, ...mqConfiguration });
    expect(amqpCallParameter2).toBe('ping');
    expect(amqpCallParameter3).toEqual({
      consume: false,
      acknowledge: false,
    });
  });

  it('should have called the node-cron scheduler function', async () => {
    buildNotificationService({ mqConfiguration, pingMessage: true });
    expect(cron.CronJob).toHaveBeenCalledWith({
      cronTime: '* * * * *',
      onTick: expect.any(Function),
      start: true,
      timeZone: 'UTC',
      context: null,
      runOnInit: true,
    });

    const { onTick } = cron.CronJob.mock.calls[0][0];
    // Fake a cron job execution
    await onTick();

    /**
     * The following test proves that pingMqMessage was called after cron
     * fire - as this message would have only been constructed by pingMqMessage.
     */
    const amqpSecondInstance = AMQP.mock.instances[1];

    expect(amqpSecondInstance.pushToTopic.mock.calls[0][0]).toEqual(JSON.stringify(expectedPingMessage));
  });
});
