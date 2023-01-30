const restify = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const server = restify();
// Middleware
server.use(restify.json());
server.use(restify.urlencoded({ extended: true }));

dotenv.config();

const generateRTCToken = (req, res, next) => {
  // set response header
  res.header("Access-Control-Allow-Origin", "*");
  // get channel name
  const channelName = req.params.channel;
  if (!channelName) {
    return res.status(400);
  }
  // get uid
  let uid = req.params.uid;
  if (!uid || uid === "") {
    return res.status(400);
  }
  // get role
  let role;
  if (req.params.role === "publisher") {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === "audience") {
    role = RtcRole.SUBSCRIBER;
  } else {
    return res.status(400);
  }
  // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === "") {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  // build the token
  let token;
  if (req.params.tokentype === "userAccount") {
    token = RtcTokenBuilder.buildTokenWithAccount(
      `${process.env.APP_ID}`,
      `${process.env.APP_CERTIFICATE_ID}`,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );
  } else if (req.params.tokentype === "uid") {
    token = RtcTokenBuilder.buildTokenWithUid(
      `${process.env.APP_ID}`,
      `${process.env.APP_CERTIFICATE_ID}`,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );
  } else {
    return res.status(400);
  }
  // return the token
  return res.send({ rtcToken: token });
};

server.options("*", cors());
server.get("/rtc/:channel/:role/:tokentype/:uid", generateRTCToken);
server.listen(process.env.PORT || 42727);