/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use the ts-jest preset to handle .ts files
  preset: 'ts-jest/presets/default-esm', // Use the ESM preset
  
  // Set the environment to 'node' since we are testing an API
  testEnvironment: 'node',
  
  // Clean up mocks before every test automatically
  clearMocks: true,
  
  // Where Jest should look for test files
  roots: ['<rootDir>/src'],
  
  // Match files ending in .test.ts or .spec.ts
  testMatch: ['**/**/*.test.ts'],

  // Optional: Add a timeout if your API or DB is slow (default is 5000ms)
  testTimeout: 10000,

  verbose: true,

  forceExit: true,

  moduleNameMapper: {
    // Maps imports ending in .js to their .ts equivalent for Jest
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    // Use ts-jest to handle files and pass the ESM flag
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};
