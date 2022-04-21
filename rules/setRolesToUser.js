async function setRolesToUser(user, context, callback) {
  // organization will always be present for company specific auth0 login
  const orgId = context.organization && context.organization.id;
  if (!orgId) {
    return callback(null, user, context);
  }

  try {
    await ensureBotEngineToken();
    const idpConfig = await getIdpConfigForOrg();

    const roleMap = idpConfig && idpConfig.roleMapping;
    if (!roleMap) {
      console.log(`${orgId} org does not have idp role mapping info`);
    }

    if (!roleMap && !user.global_roles) {
      console.log(`${user.user_id} does not have any global roles either`);
      callback(null, user, context);
      return;
    }

    if (
      user.global_roles &&
      user.global_roles.length &&
      orgId !== configuration.GLOBAL_ROLES_PROVIDER_ORG_ID
    ) {
      console.log(`global_roles for user ${user.user_id} will not be applied`);
    }

    await ensureAuth0OrgManager();
    const { organizations } = global.auth0OrgManager;

    const currentRoles = await organizations.getMemberRoles({
      id: orgId,
      user_id: user.user_id,
    });

    const { toAdd, toRemove } = getRoleUpdates(user, idpConfig, currentRoles);

    if (toAdd.length) {
      await organizations.addMemberRoles(
        { id: orgId, user_id: user.user_id },
        { roles: toAdd }
      );
    }

    if (toRemove.length) {
      await organizations.removeMemberRoles(
        { id: orgId, user_id: user.user_id },
        { roles: toRemove }
      );
    }

    callback(null, user, context);
  } catch (err) {
    console.log(
      `Unable to update roles of user ${user.user_id} for org ${orgId}: ${err.message}`
    );
    callback(null, user, context);
  }

  async function ensureBotEngineToken() {
    if (
      global.accessToken &&
      global.tokenExpiryTime &&
      Date.now() < global.tokenExpiryTime
    ) {
      return global.accessToken;
    }

    const authRes = await require("axios@0.21.1").post(
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

    // TTL = 3 minutes before token expiry
    global.accessToken = authRes.data.accessToken;
    const { exp } = require("jwt-decode@3.1.1")(global.accessToken);
    global.tokenExpiryTime = exp * 1000 - 3 * 60 * 1000;

    return global.accessToken;
  }

  async function ensureAuth0OrgManager() {
    if (!global.auth0OrgManager) {
      const ManagementClient = require("auth0@2.35.0").ManagementClient;
      global.auth0OrgManager = new ManagementClient({
        domain: auth0.domain,
        clientId: configuration.CLIENT_ID,
        clientSecret: configuration.CLIENT_SECRET,
        scope: "create:organization_member_roles",
      });
    }
    return global.auth0OrgManager;
  }

  async function getIdpConfigForOrg() {
    const orgInfoRes = await require("axios@0.21.1")({
      method: "GET",
      url: `${configuration.AUTH_ENDPOINT}/orgs?auth0OrgId=${orgId}`,
      headers: { Authorization: global.accessToken },
    });

    const resData = orgInfoRes.data;
    const orgInfo = resData && resData.data && resData.data[0];

    if (!orgInfo) {
      throw new Error("ORG_DOES_NOT_EXIST");
    }

    return orgInfo.idpConfig;
  }

  function getRoleUpdates(user, idpConfig, currentRoles) {
    const globalRolesMap = {
      SSO_Console_Superadmin: configuration.SUPER_ADMIN_ROLE_ID,
      SSO_Console_Developer: configuration.DEVELOPER_ROLE_ID,
      SSO_Console_Employee: configuration.EMPLOYEE_ROLE_ID,
    };
    const globalRoleIds = Object.values(globalRolesMap);
    const currRoleIds = currentRoles.map((roleInfo) => roleInfo.id);
    let desiredRoleIds = [];

    if (idpConfig && idpConfig.roleMapping) {
      const roleMap = idpConfig.roleMapping;
      const roleField = idpConfig.roleField || "role";
      let rolesFromIdp = user[roleField];
      if (!Array.isArray(rolesFromIdp)) {
        rolesFromIdp = [rolesFromIdp];
      }
      desiredRoleIds = rolesFromIdp.map((roleFromIdp) => roleMap[roleFromIdp]);

      // Global roles must not be allowed to be configured via org role mappings
      desiredRoleIds = desiredRoleIds.filter(
        (role) => !globalRoleIds.includes(role)
      );
    }

    // Only selected idp is allowed to specify global roles
    if (
      Array.isArray(user.global_roles) &&
      orgId === configuration.GLOBAL_ROLES_PROVIDER_ORG_ID
    ) {
      user.global_roles.forEach(function (role) {
        if (globalRolesMap[role]) {
          desiredRoleIds.push(globalRolesMap[role]);
        }
      });
    }

    // To be removed after migration of users from BE to Okta
    if (new RegExp("e-bot7.com$").test(user.email)) {
      desiredRoleIds.push(configuration.EMPLOYEE_ROLE_ID);
    }

    // deduplicate roles
    desiredRoleIds = Array.from(new Set(desiredRoleIds));

    let toAdd = [];
    let toRemove = [];
    if (desiredRoleIds.length) {
      toAdd = desiredRoleIds.filter((role) => !currRoleIds.includes(role));
      toRemove = currRoleIds.filter((role) => !desiredRoleIds.includes(role));
    } else {
      toRemove = currRoleIds;
    }

    return { toAdd, toRemove };
  }
}
