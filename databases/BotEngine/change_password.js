function changePassword(email, newPassword, callback) {
  // This script should change the password stored for the current user in your
  // database. It is executed when the user clicks on the confirmation link
  // after a reset password request.
  // The content and behavior of password confirmation emails can be customized
  // here: https://manage.auth0.com/#/emails
  // The `newPassword` parameter of this function is in plain text. It must be
  // hashed/salted to match whatever is stored in your database.
  //
  // There are three ways that this script can finish:
  // 1. The user's password was updated successfully:
  //     callback(null, true);
  // 2. The user's password was not updated:
  //     callback(null, false);
  // 3. Something went wrong while trying to reach your database:
  //     callback(new Error("my error message"));
  //
  // If an error is returned, it will be passed to the query string of the page
  // where the user is being redirected to after clicking the confirmation link.
  // For example, returning `callback(new Error("error"))` and redirecting to
  // https://example.com would redirect to the following URL:
  //     https://example.com?email=alice%40example.com&message=error&success=false

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

      const accessToken = response.data.accessToken;

      try {
        const userInfoRes = await axios({
          method: "GET",
          url: `${configuration.AUTH_ENDPOINT}/users?email=${email}`,
          headers: { Authorization: accessToken },
        });

        const resData = userInfoRes.data;
        const userInfo = resData && resData.data && resData.data[0];

        if (!userInfo || !userInfo._id) {
          callback(new Error("USER NOT EXIST"));
          return;
        }

        const patchUserRes = await axios({
          method: "PATCH",
          url: `${configuration.AUTH_ENDPOINT}/users/${userInfo._id}`,
          headers: { Authorization: accessToken },
          data: { password: newPassword },
        });

        callback(null, patchUserRes.status === 200);
      } catch (err) {
        callback(new Error(err.message));
      }
    })
    .catch((err) => {
      callback(new Error(err.message));
    });
}
