import { ManagementClient } from "auth0";
import slugify from "slugify";
import { Config } from "./config";

export class Auth0 {
  management: ManagementClient;
  constructor(config: Config) {
    this.management = new ManagementClient({
      ...config.getAuth0Credential(),
      scope: "create:organizations",
    });
  }

  createOrg(orgName: string) {
    return this.management.organizations.create({
      name: slugify(orgName, { lower: true }),
      display_name: orgName,
    });
  }
}
