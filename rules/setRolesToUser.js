async function setRolesToUser(user, context, callback) {
  // Organisation id only exist for Login via external IDP
  const orgId = context.organization && context.organization.id;
  if (!orgId) {
    return callback(null, user, context);
  }

  try {
    const axios = require("axios@0.21.1");

    const authRes = await axios.post(
      `${configuration.AUTH_ENDPOINT}/authentication`,
      {
        strategy: "local-api",
        apiKey: configuration.API_KEY,
        apiSecret: configuration.API_SECRET,
      }
    );

    if (!authRes.data || !authRes.data.accessToken) {
      throw new Error("BOT_ENGINE_AUTH_FAILED");
    }

    const accessToken = authRes.data.accessToken;

    const orgInfoRes = await axios({
      method: "GET",
      url: `${configuration.AUTH_ENDPOINT}/orgs?auth0OrgId=${orgId}`,
      headers: { Authorization: accessToken },
    });

    const resData = orgInfoRes.data;
    const orgInfo = resData && resData.data && resData.data[0];

    if (!orgInfo) {
      throw new Error("ORG_NOT_EXIST");
    }

    if (!orgInfo.idpConfig || !orgInfo.idpConfig.roleMapping) {
      console.log(`${orgId} org does not have idp role mapping info`);
      callback(null, user, context);
      return;
    }

    const roleMapInfo = orgInfo.idpConfig.roleMapping;
    const roleField = orgInfo.idpConfig.roleField || "role";
    const roles = roleMapInfo[user[roleField]];

    if (!roles) {
      throw new Error("ROLE_NOT_EXIST");
    }

    const ManagementClient = require("auth0@2.35.0").ManagementClient;
    const management = new ManagementClient({
      domain: auth0.domain,
      clientId: configuration.CLIENT_ID,
      clientSecret: configuration.CLIENT_SECRET,
      scope: "create:organization_member_roles",
    });

    await management.organizations.addMemberRoles(
      { id: orgId, user_id: user.user_id },
      { roles }
    );
    callback(null, user, context);
  } catch (err) {
    console.log(
      `Unable to check ${orgId} and update roles to user ${user.user_id} ${err.message}`
    );
    callback(null, user, context);
  }
}
