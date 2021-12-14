import dotenv from "dotenv";
import { Auth0 } from "./lib/auth0";
import { BotEngine } from "./lib/botengine";
import { Config } from "./lib/config";

dotenv.config();

const migrateOrg = async (config: Config, orgId: string) => {
  if (!orgId) {
    console.log("Please provide non-empty bot engine orgId");
    return;
  }
  const botEngine = new BotEngine(config);
  const auth0 = new Auth0(config);
  const { name } = await botEngine.getOrgInfoById(orgId);
  console.log(`migrating org:${name}`);
  const { id: auth0OrgId } = await auth0.createOrg(name);
  console.log(`org created in auth0:${auth0OrgId}`);
  await botEngine.updateOrgId(orgId, auth0OrgId);
};

const env = process.argv[2];
const orgId = process.argv[3];
migrateOrg(new Config(env), orgId);
