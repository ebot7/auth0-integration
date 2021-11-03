function getByEmail(email, callback) {
  // This script should retrieve a user profile from your existing database,
  // without authenticating the user.
  // It is used to check if a user exists before executing flows that do not
  // require authentication (signup and password reset).
  //
  // There are three ways this script can finish:
  // 1. A user was successfully found. The profile should be in the following
  // format: https://auth0.com/docs/users/normalized/auth0/normalized-user-profile-schema.
  //     callback(null, profile);
  // 2. A user was not found
  //     callback(null);
  // 3. Something went wrong while trying to reach your database:
  //     callback(new Error("my error message"));

  const axios = require("axios@0.21.1");

  axios
    .post(`${configuration.AUTH_ENDPOINT}/authentication`, {
      strategy: "local-api",
      apiKey: configuration.API_KEY,
      apiSecret: configuration.API_SECRET,
    })
    .then(async (response) => {
      if (!response.data || !response.data.accessToken) {
        callback(new Error("AUTH0 USER AUTHENTICATION FAILS"));
        return;
      }

      try {
        const userInfoRes = await axios({
          method: "GET",
          url: `${configuration.AUTH_ENDPOINT}/users?email=${email}`,
          headers: { Authorization: response.data.accessToken },
        });

        const resData = userInfoRes.data;
        const userInfo = resData && resData.data && resData.data[0];

        if (!userInfo || !userInfo._id) {
          callback(new Error("USER NOT EXIST"));
          return;
        }

        callback(null, {
          email,
          user_id: userInfo._id,
        });
      } catch (err) {
        // Error object may reveal auth0 user access Token
        callback(new Error(err.message));
      }
    })
    .catch((err) => {
      // Error object may reveal auth0 user access Token
      callback(new Error(err.message));
    });
}
