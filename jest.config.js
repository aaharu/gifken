module.exports = {
  globals: {
    "ts-jest": {
      tsConfig: {
        typeRoots: ["node_modules/@types"]
      }
    }
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  transform: {
    "\\.(ts|tsx)$": "ts-jest"
  },
  testMatch: ["**/test/**/*.ts?(x)"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts?(x)"]
};
