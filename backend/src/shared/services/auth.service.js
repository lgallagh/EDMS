const { plainToClass } = require("class-transformer");
const { EDMSError } = require("../exceptions/edms-error");
const { EDMSUser } = require("../models/user");
const logger = require("winston");
const jwt = require("jsonwebtoken");
const db = require("./db.service");
const crypto = require("crypto");
const ldapService = require("./ldap.service");
const auditService = require("./audit.service");

let refreshTokens = [];

/**
 * Validate user credentials against the database, then generate access and refresh tokens if successful.
 */
async function loginService(req, res, next) {
  logger.debug("Entering login");

  const username = req.body.username;
  const password = req.body.password;
  let user = new EDMSUser();
  logger.debug("Trying login for: " + username);

  if (!username || !password) {
    return next(
      new EDMSError({
        httpCode: 401,
        description: "Both username and password are required.",
      })
    );
  }

  
  user.username = username;
  user.password = password;
  user.privilege = "R";
  logger.debug("Username and password both provided. Starting user lookup.");
  const userDN = await ldapService.authenticate(username,password);
  logger.debug(`Found UserDN: ${userDN}`)
  if(userDN){
    logger.debug("User Found in LDAP.");

    const params = new Map();
    params.set("username", username);
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetUserLogin`, "ENTA", params);
    if (result.recordsets[0].length > 0) {
      logger.debug("User found.");
      user = plainToClass(EDMSUser, result.recordsets[0][0]);
    }
    if(user.isDelete === "Y") {
      user.privilege = "R"
    }
  }else{
    logger.debug("User not found in LDAP");
    return next(
      new EDMSError({
        httpCode: 401,
        description: "Login failed: Invalid user or password",
      })
    );
  }




  const token = jwt.sign(
    { id: user.id, username: user.username, privilege: user.privilege },
    process.env.AUTH_KEY,
    { expiresIn: Number(process.env.AUTH_EXPIRES) }
  );

  const refreshToken = jwt.sign(
    { id: user.id, username: user.username, privilege: user.privilege },
    process.env.REFRESH_KEY,
    { expiresIn: Number(process.env.REFRESH_EXPIRES) }
  );

  logger.debug("User access/refresh tokens generated.");

  refreshTokens[user.username] = refreshToken;

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.SECURE_COOKIE !== "false",
    maxAge: Number(process.env.REFRESH_EXPIRES) * 1000,
  });

  logger.debug("Refresh token cookie set on response.");

  await auditService.auditLogin(user.username);

  res.status(200).send({
    user:{username:user.username, privilege: user.privilege},
    accessToken: token
  });
}

/**
 * Invalidate user's refresh token and replace their access token with one that immediately expires.
 */
function logoutService(req, res) {
  if (req.cookies?.jwt) {
    jwt.verify(req.cookies.jwt, process.env.REFRESH_KEY, (err, decoded) => {
      if (!err) {
        delete refreshTokens[decoded.username];
      }
    });
  }

  const authHeader = req.headers["x-access-token"];
  jwt.sign(authHeader, "", { expiresIn: 1 }, (logout, err) => {
    if (logout) {
      res.send({ success: "success", message: "You have been Logged Out" });
    } else {
      res.send({ error: "error", message: err.message });
    }
  });
}

/**
 * Verify that an access token is still valid.
 */
function verifyTokenService(req, res, next) {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(401).send({ message: "Unauthorized: No auth token." });
  }

  jwt.verify(token, process.env.AUTH_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized: Invalid auth token." });
    }

    res.locals.userId = decoded.id;
    res.locals.userName = decoded.username;
    res.locals.privilege = decoded.privilege;
    next();
  });
}

/**
 * Refresh user's tokens if they still have a valid refresh token.
 */
function refreshService(req, res) {
  if (req.cookies?.jwt) {
    const oldRefreshToken = req.cookies.jwt;

    jwt.verify(oldRefreshToken, process.env.REFRESH_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized: Refresh Token Invalid" });
      }

      if (refreshTokens[decoded.username] === oldRefreshToken) {
        const accessToken = jwt.sign(
          { id: decoded.id, username: decoded.username, privilege: decoded.privilege },
          process.env.AUTH_KEY,
          { expiresIn: Number(process.env.AUTH_EXPIRES) }
        );

        const newRefreshToken = jwt.sign(
          { id: decoded.id, username: decoded.username, privilege: decoded.privilege },
          process.env.REFRESH_KEY,
          { expiresIn: Number(process.env.REFRESH_EXPIRES) }
        );

        refreshTokens[decoded.username] = newRefreshToken;

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          sameSite: "Lax",
          secure: process.env.SECURE_COOKIE !== "false",
          maxAge: Number(process.env.REFRESH_EXPIRES) * 1000,
        });

        return res.json({ accessToken });
      }

      return res.status(401).json({ message: "Unauthorized" });
    });
  } else {
    return res.status(403).json({ message: "Unauthorized: No Refresh Token" });
  }
}

/**
 * Verify write permissions.
 */

function verifyWrite(req, res, next) { 
  try {
    if (res.locals.privilege === 'R') {
      return res.status(403).json({ message: 'Forbidden:' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid auth token.' });
  }
}

module.exports = {
  loginService,
  logoutService,
  verifyTokenService,
  refreshService,
  verifyWrite
};
