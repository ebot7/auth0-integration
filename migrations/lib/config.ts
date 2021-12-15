export class Config {
  isProduction: boolean;
  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
  }

  getBotEngineEndPoint() {
    return this.isProduction
      ? "https://console.e-bot7.de/engine"
      : "https://staging.e-bot7.de/engine";
  }

  getBotEngineApiCredential() {
    return {
      apiKey: `${process.env.AUTH0_BOT_ENGINE_API_KEY}`,
      apiSecret: `${process.env.AUTH0_BOT_ENGINE_API_SECRET}`,
    };
  }

  getAuth0Credential() {
    if (this.isProduction) {
      // Need to update clientId
      return {
        domain: "https://console.e-bot7.de",
        clientId: `${process.env.PRODUCTION_AUTH0_CLIENT_ID}`,
        clientSecret: `${process.env.PRODUCTION_AUTH0_CLIENT_SECRET}`,
      };
    }

    return {
      domain: "dev-zf0bz1nz.eu.auth0.com",
      clientId: `${process.env.STAGING_AUTH0_CLIENT_ID}`,
      clientSecret: `${process.env.STAGING_AUTH0_CLIENT_SECRET}`,
    };
  }
}
