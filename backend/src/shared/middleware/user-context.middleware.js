//Attach user information to a single property on the request
function userContextMiddleware(req, res, next) {
    const username = req.headers["x-username"] || "Unknown User";
    const ip = req.ip;
  
    req.userContext = { username, ip };
    next();
  }
  
  module.exports = userContextMiddleware;
  