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
        domain: "e-bot7-production.eu.auth0.com",
        clientId: "uI7SLzu9mQgU9izqW9AraRW8Uw3Ia6R2",
        clientSecret: `${process.env.PRODUCTION_AUTH0_CLIENT_SECRET}`,
      };
    }

    return {
      domain: "e-bot7-staging.eu.auth0.com",
      clientId: "Tr25hW3MBghQRuYinFhRnnOI9CdlUWCG",
      clientSecret: `${process.env.STAGING_AUTH0_CLIENT_SECRET}`,
    };
  }
}
