function login(email, password, callback) {
  const axios = require("axios@0.21.1");

  axios
    .post(`${configuration.AUTH_ENDPOINT}/authentication`, {
      strategy: "local",
      email,
      password,
    })
    .then((response) => {
      const jwtDecode = require("jwt-decode@3.1.1");
      const decodedJwt = jwtDecode(response.data.accessToken);

      callback(null, {
        user_id: decodedJwt.userId,
        org_id: decodedJwt.orgId,
        email,
      });
    })
    .catch((error) => {
      callback(new WrongUsernameOrPasswordError(email));
    });
}
