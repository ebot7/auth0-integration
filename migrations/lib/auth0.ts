import { ManagementClient } from "auth0";
import slugify from "slugify";
import { Config } from "./config";
import { OrgInfo, UserInfo } from "./types";

export class Auth0 {
  config: Config;
  management: ManagementClient;

  constructor(config: Config) {
    this.config = config;
    this.management = new ManagementClient({
      ...config.getAuth0Credential(),
      scope: "create:organizations create:organization_connections",
    });
  }

  async enableBotEngineDb(id: string) {
    return this.management.organizations.addEnabledConnection(
      {
        id,
      },
      {
        connection_id: this.config.getBotEngineConnectionDB(),
      }
    );
  }

  async createOrg(orgInfo: OrgInfo) {
    console.log(`creating org:${orgInfo.name}`);
    const auth0OrgInfo = await this.management.organizations.create({
      name: slugify(orgInfo.name, { lower: true }),
      display_name: orgInfo.name,
    });
    console.log(`org created in auth0:${auth0OrgInfo.id}`);

    await this.enableBotEngineDb(auth0OrgInfo.id);
    console.log(`botengine db connection enabled for :${auth0OrgInfo.id}`);

    return auth0OrgInfo;
  }
}
