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
const BadgeService = require('../../lib/badges');

const successfulTxHash = '0x1234556';
const pendingTxHash = '0xpending';
const failedTxHash = '0xfailed';

describe('Badges Service', () => {
  describe('checkTxStatus', () => {
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
});
