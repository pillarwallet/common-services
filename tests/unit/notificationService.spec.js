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
const aws = require('aws-sdk');

const buildNotificationService = require('../../lib/notifications');

jest.mock('aws-sdk');

describe('Notification Service', () => {
  let sqsConfiguration;

  beforeEach(() => {
    sqsConfiguration = {
      region: 'us-east-1',
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/testing/test.fifo',
      fifoQueue: true,
    };
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('creates a new instance of aws.SQS', () => {
    buildNotificationService({ sqsConfiguration, dbModels: {} });

    expect(aws.SQS.mock.instances).toHaveLength(1);
  });

  it('should have instantiated a new aws.SQS with the correct config options', () => {
    buildNotificationService({ sqsConfiguration, dbModels: {} });
    delete sqsConfiguration.queueUrl;
    delete sqsConfiguration.fifoQueue;
    expect(aws.SQS.mock.calls[0][0]).toEqual(sqsConfiguration);
  });

  it('should return the Notification Service instance', () => {
    const NotificationService = buildNotificationService({
      sqsConfiguration,
      dbModels: {},
    });

    expect(typeof NotificationService.sendMessage).toBe('function');
    expect(typeof NotificationService.createBadgesNotification).toBe('function');
    expect(typeof NotificationService.onUserRegisteredBadgeNotification).toBe('function');
    expect(typeof NotificationService.onWalletImportedBadgeNotification).toBe('function');
    expect(typeof NotificationService.onConnectionEstablishedBadgeNotification).toBe('function');
    expect(typeof NotificationService.onTransactionMadeBadgeNotification).toBe('function');
    expect(typeof NotificationService.onTransactionReceivedBadgeNotification).toBe('function');
    expect(typeof NotificationService.onEmailVerifiedBadgeNotification).toBe('function');
    expect(typeof NotificationService.onPhoneVerifiedBadgeNotification).toBe('function');
    expect(typeof NotificationService.onReferralRewardReceivedBadgeNotification).toBe('function');
    expect(typeof NotificationService.onFirstReferralSentBadgeNotification).toBe('function');
    expect(typeof NotificationService.onFirstAaveDepositBadgeNotification).toBe('function');
  });

  it('should fail on invalid params, queueUrl', () => {
    expect(() => buildNotificationService({ sqsConfiguration: {}, dbModels: {} })).toThrowError(
      new TypeError('Missing queue url'),
    );
  });
});
