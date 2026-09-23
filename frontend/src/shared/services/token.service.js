const getLocalAccessToken = () => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}') : null;
    return user && user.accessToken;
  };
  
  const getOverrideAccess = () => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}') : null;
    return user && user.overrideQQ;
  };
  
  const updateLocalAccessToken = (token) => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}') : null;
    if (user) {
      user.accessToken = token;
      localStorage.setItem("user", JSON.stringify(user));
    }
  };
  
  const getUser = () => {
    return localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}') : null;
  };
  
  const setUser = (user) => {
    localStorage.removeItem("gridgridMainQueue");
    localStorage.setItem("user", JSON.stringify(user));
  };
  
  const removeUser = () => {
    localStorage.removeItem("gridgridMainQueue");
    localStorage.removeItem("user");
  };
  
  /**
   * Handles local storage of the user and the access token. The token will only be valid for a short while, but a new one can
   * be retrieved if there is a valid refresh token.
   */
  const TokenService = {
    getLocalAccessToken,
    updateLocalAccessToken,
    getOverrideAccess,
    getUser,
    setUser,
    removeUser,
  };
  
  export default TokenService;
  