jest.setMock('ethers', {
  getDefaultProvider: () => ({
    getTransactionReceipt: txHash => {
      if (!txHash) return Promise.reject(new Error('No hash provided'));

      let response = { status: 'confirmed', hash: txHash };
      if (txHash === '0xfailed') response = { hash: txHash };
      if (txHash === '0xpending') response = null;

      return Promise.resolve(response);
    },
  }),
  Contract: () => ({
    connect: () => ({
      awardToken: () => Promise.resolve({ hash: '1234' }),
      batchAwardToken: () => Promise.resolve({ hash: '1234' }),
    }),
  }),
  Wallet: () => ({}),
});
