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

const successfulTxHash = '0x1234556';
const pendingTxHash = '0xpending';
const failedTxHash = '0xfailed';

const networkSettings = {
  name: 'ropsten',
  infuraProjectId: '123',
};

describe('Badges Service', () => {
  it('should return the BadgeService instance', () => {
    const BadgeService = buildBadgeService({ network: networkSettings, smartContractAddress: '0x123' });

    expect(typeof BadgeService.onUserRegistered).toBe('function');
    expect(typeof BadgeService.onWalletImported).toBe('function');
    expect(typeof BadgeService.onConnectionEstablished).toBe('function');
    expect(typeof BadgeService.onTransactionMade).toBe('function');
    expect(typeof BadgeService.onTransactionReceived).toBe('function');
    expect(typeof BadgeService.selfAward).toBe('function');
    expect(typeof BadgeService.checkTxStatus).toBe('function');
    expect(typeof BadgeService.mintBadge).toBe('function');
    expect(typeof BadgeService.awardBadge).toBe('function');
    expect(typeof BadgeService.massBadgeAward).toBe('function');
  });

  it('should fail on invalid params', () => {
    expect(() => buildBadgeService({ network: networkSettings })).toThrowError(
      new TypeError('smartContractAddress is not set'),
    );
    expect(() => buildBadgeService({ smartContractAddress: '0x123' })).toThrowError(
      new TypeError('network name is not set'),
    );
  });

  it('should fail on missing infura project id', () => {
    const BadgeService = buildBadgeService({
      network: { ...networkSettings, infuraProjectId: '' },
      smartContractAddress: '0x123',
    });
    expect(() => BadgeService.checkTxStatus(successfulTxHash)).toThrowError(new Error('infuraProjectId is not set'));
  });

  describe('checkTxStatus()', () => {
    let BadgeService;

    beforeEach(() => {
      BadgeService = buildBadgeService({ network: networkSettings, smartContractAddress: '0x123' });
    });

    it('should return tx status as `confirmed` for successful transaction', async () => {
      const expectedStatus = 'confirmed';
      const txStatus = await BadgeService.checkTxStatus(successfulTxHash);
      return expect(txStatus).toEqual(expectedStatus);
    });

    it('should return tx status as `pending` for pending transaction', async () => {
      const expectedStatus = 'pending';
      const txStatus = await BadgeService.checkTxStatus(pendingTxHash);
      expect(txStatus).toEqual(expectedStatus);
    });

    it('should return tx status as `failed` for unsuccessful transaction', async () => {
      const expectedStatus = 'failed';
      const txStatus = await BadgeService.checkTxStatus(failedTxHash);
      expect(txStatus).toEqual(expectedStatus);
    });
  });

  describe('awardBadge()', () => {
    let BadgeService;

    it('should fail without passing the private key', async () => {
      expect.assertions(1);
      BadgeService = buildBadgeService({ network: networkSettings, smartContractAddress: '0x123' });
      await expect(BadgeService.awardBadge()).rejects.toEqual(new Error('privateKey is not set'));
    });
  });

  describe('massBadgeAward()', () => {
    let BadgeService;

    it('should fail without passing the private key', async () => {
      expect.assertions(1);
      BadgeService = buildBadgeService({ network: networkSettings, smartContractAddress: '0x123' });
      await expect(BadgeService.massBadgeAward()).rejects.toEqual(new Error('privateKey is not set'));
    });
  });
});
