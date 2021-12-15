import dotenv from "dotenv";
import { Auth0 } from "./lib/auth0";
import { BotEngine } from "./lib/botengine";
import { Config } from "./lib/config";

dotenv.config();
const config = new Config();

const migrateOrg = async (orgId: string, domain: string) => {
  if (!orgId) {
    console.log("Please provide non-empty bot engine orgId");
    return;
  }
  const botEngine = new BotEngine(config);
  const auth0 = new Auth0(config);
  const orgInfo = await botEngine.getOrgInfoById(orgId);
  const { id: auth0OrgId } = await auth0.createOrg(orgInfo);
  await botEngine.updateOrg(orgId, auth0OrgId, domain);
  console.log(`auth0 orgId updated in bot-engine`);
};

const orgId = process.argv[2];
const emailDomain = process.argv[3];
migrateOrg(orgId, emailDomain);
