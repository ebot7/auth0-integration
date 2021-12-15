import axios from "axios";
import { Config } from "./config";

export class BotEngine {
  config: Config;
  accessToken: string;
  constructor(config: Config) {
    this.config = config;
    this.accessToken = "";
  }

  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    const authRes = await axios.post(
      `${this.config.getBotEngineEndPoint()}/authentication`,
      {
        strategy: "local-api",
        ...this.config.getBotEngineApiCredential(),
      }
    );

    if (!authRes.data || !authRes.data.accessToken) {
      throw new Error("BOT_ENGINE_AUTH_FAILED");
    }

    this.accessToken = authRes.data.accessToken;
    return this.accessToken;
  }

  async getOrgInfoById(orgId: string) {
    const orgInfoRes = await axios.get(
      `${this.config.getBotEngineEndPoint()}/orgs/${orgId}`,
      { headers: { Authorization: await this.getAccessToken() } }
    );

    const orgInfo = orgInfoRes.data;

    if (!orgInfo || !orgInfo._id) {
      throw new Error("ORG_NOT_EXIST");
    }

    console.log("orgInfo", orgInfo);
    return orgInfo;
  }

  async updateOrgId(orgId: string, auth0OrgId: string) {
    return axios.patch(
      `${this.config.getBotEngineEndPoint()}/orgs/${orgId}`,
      {
        auth0OrgId,
      },
      {
        headers: { Authorization: await this.getAccessToken() },
      }
    );
  }
}
