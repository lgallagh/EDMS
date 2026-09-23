const auth = require("../services/auth.service");

async function login(req, res, next) {
  try {
    await auth.loginService(req, res, next);
  } catch (err) {
    console.error("Error while logging in", err.message);
    next(err);
  }
}

function logout(req, res, next) {
  try {
    auth.logoutService(req, res);
  } catch (err) {
    console.error("Error while logging out", err.message);
    next(err);
  }
}

function verifyToken(req, res, next) {
  try {
    auth.verifyTokenService(req, res, next);
  } catch (err) {
    console.error("Error while verifying token", err.message);
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    await auth.refreshService(req, res, next);
  } catch (err) {
    console.error("Error while refreshing login", err.message);
    next(err);
  }
}

module.exports = {
  login,
  logout,
  verifyToken,
  refresh,
};
