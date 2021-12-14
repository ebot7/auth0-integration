import dotenv from "dotenv";
import { Auth0 } from "./lib/auth0";
import { BotEngine } from "./lib/botengine";
import { Config } from "./lib/config";

dotenv.config();

const migrateOrg = async (config: Config,orgId: string) => {
    const botEngine = new BotEngine(config);
    const auth0 = new Auth0(config);
    const { name } = await botEngine.getOrgInfoById(orgId);
    const { id: auth0OrgId } = await auth0.createOrg(name)
    await botEngine.updateOrgId(orgId, auth0OrgId)
};

