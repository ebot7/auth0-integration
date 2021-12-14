import axios from "axios";
import { config } from "dotenv/lib/main";
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

  async getOrgInfoById(orgId) {
    const orgInfoRes = await axios({
      method: "GET",
      url: `${this.config.getBotEngineEndPoint()}/orgs/${orgId}`,
      headers: { Authorization: await this.getAccessToken() },
    });

    const resData = orgInfoRes.data;
    const orgInfo = resData && resData.data && resData.data[0];

    if (!orgInfo) {
      throw new Error("ORG_NOT_EXIST");
    }

    return orgInfo;
  }

  async updateOrgId(orgId: string, auth0OrgId: string) {
    return axios({
      method: "PUT",
      url: `${this.config.getBotEngineEndPoint()}/orgs/${orgId}`,
      headers: { Authorization: await this.getAccessToken() },
      data: {
        auth0OrgId
      }
    });
  }
}
