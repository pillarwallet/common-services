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
const buildBadgeService = require('../../lib/badges');

const Badge = jest.fn();
const BadgeAward = jest.fn();

describe('Badges Service', () => {
  it('should return the BadgeService instance', () => {
    const BadgeService = buildBadgeService({ dbModels: { Badge, BadgeAward } });

    expect(typeof BadgeService.onUserRegistered).toBe('function');
    expect(typeof BadgeService.onWalletImported).toBe('function');
    expect(typeof BadgeService.onConnectionEstablished).toBe('function');
    expect(typeof BadgeService.onTransactionMade).toBe('function');
    expect(typeof BadgeService.onTransactionReceived).toBe('function');
    expect(typeof BadgeService.onEmailVerified).toBe('function');
    expect(typeof BadgeService.onPhoneVerified).toBe('function');
    expect(typeof BadgeService.onReferralRewardReceived).toBe('function');
    expect(typeof BadgeService.onFirstReferralSent).toBe('function');
    expect(typeof BadgeService.onFiveReferralsSent).toBe('function');
    expect(typeof BadgeService.onTenReferralsSent).toBe('function');
    expect(typeof BadgeService.onTwentyfiveReferralsSent).toBe('function');
    expect(typeof BadgeService.onHundredReferralsSent).toBe('function');
    expect(typeof BadgeService.onFirstAaveDeposit).toBe('function');
  });

  it('should fail on invalid params', () => {
    expect(() => buildBadgeService({ dbModels: { BadgeAward } })).toThrowError(
      new TypeError('Badge model is not provided'),
    );
    expect(() => buildBadgeService({ dbModels: { Badge } })).toThrowError(
      new TypeError('BadgeAward model is not provided'),
    );
  });
});
