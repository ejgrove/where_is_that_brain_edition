const appJson = require('./app.json');

module.exports = () => {
  const baseUrl = (process.env.EXPO_BASE_URL ?? '').trim();
  const expoConfig = appJson.expo;

  return {
    ...expoConfig,
    experiments: {
      ...(expoConfig.experiments ?? {}),
      baseUrl,
    },
  };
};
