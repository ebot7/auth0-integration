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
  const orgInfo = await botEngine.getOrgInfoById(orgId);
  const { id: auth0OrgId } = await auth0.createOrg(orgInfo);
  await botEngine.updateOrgId(orgId, auth0OrgId);
  console.log(`auth0 orgId updated in bot-engine`);
};

const env = process.argv[2];
const orgId = process.argv[3];
migrateOrg(new Config(env), orgId);
