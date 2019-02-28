const loggerConstructor = require('@pillarwallet/common-logger');
const loggerBuilder = require('../../../utilities/logger');

jest.mock('@pillarwallet/common-logger', () => jest.fn().mockImplementation(loggerInstance => loggerInstance));

const loggerInstance = {
  logToFile: false,
  name: 'common-services',
  path: '',
};

afterAll(() => {
  loggerConstructor.mockRestore();
});

describe('Logger', () => {
  let logger;
  it('builds a new instance of Common Logger', () => {
    logger = loggerBuilder(loggerInstance);
    expect(loggerConstructor).toBeCalledWith(loggerInstance);
  });

  it('exports the returned logger instance', () => {
    logger = loggerBuilder(loggerInstance);
    expect(logger).toEqual(loggerInstance);
  });
});
