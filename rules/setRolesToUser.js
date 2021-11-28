function setRolesToUser(user, context, callback) {
  // Organisation id only exist for Login via external IDP
  if (!context.organization || !context.organization.id) {
    return callback(null, user, context);
  }

  const axios = require("axios@0.21.1");

  function getAccessToken(cb) {
    if (global.accessToken) {
      cb(null, global.accessToken);
    }

    axios
      .post(`${configuration.AUTH_ENDPOINT}/authentication`, {
        strategy: "local-api",
        apiKey: configuration.API_KEY,
        apiSecret: configuration.API_SECRET,
      })
      .then(async (response) => {
        if (!response.data || !response.data.accessToken) {
          console.log("Auth0 admin user authentication fails");
          cb(new Error("BOT_ENGINE_AUTH_FAILED"));
          return;
        }

        const accessToken = response.data.accessToken;
        global.accessToken = accessToken;
        cb(null, accessToken);
      })
      .catch((err) => {
        console.log(`Auth0 admin user authentication fails ${err.message}`);
        cb(err);
      });
  }

  getAccessToken(async (err, accessToken) => {
    if (err) {
      callback(null, user, context);
      return;
    }
    try {
      const orgsInfoRes = await axios({
        method: "GET",
        url: `${configuration.AUTH_ENDPOINT}/orgs?auth0OrgId=${context.organization.id}`,
        headers: { Authorization: accessToken },
      });

      const resData = orgsInfoRes.data;
      const orgInfo = resData && resData.data && resData.data[0];

      if (!orgInfo) {
        console.log(`${context.organization.id} organisation not exist`);
        callback(null, user, context);
        return;
      }

      if (!orgInfo.idpConfig || !orgInfo.idpConfig.roleMapping) {
        console.log(
          `${context.organization.id} org does not have idp role config`
        );
        callback(null, user, context);
        return;
      }

      const roleMapInfo = orgInfo.idpConfig.roleMapping;
      const roleField = orgInfo.idpConfig.roleField || "role";
      const roles = roleMapInfo[user[roleField]];

      if (!roles) {
        console.log(`Role mapping not exist for ${roleField}`);
        callback(null, user, context);
        return;
      }

      const ManagementClient = require("auth0@2.35.0").ManagementClient;
      const management = new ManagementClient({
        domain: auth0.domain,
        clientId: configuration.CLIENT_ID,
        clientSecret: configuration.CLIENT_SECRET,
        scope: "create:organization_member_roles",
      });

      management.organizations.addMemberRoles(
        { id: context.organization.id, user_id: user.user_id },
        { roles },
        function (error) {
          if (error) {
            console.log(`Error assigning role: ${error.message}`);
          }
          callback(null, user, context);
        }
      );
    } catch (e) {
      console.log(`Error fetching org info by auth0 orgId ${e.message}`);
      callback(null, user, context);
    }
  });
}
