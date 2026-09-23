import React from "react";

const Header = () => {
  return (
    <div id="header">
      <div className="header_bg">
        <a href="/">
          <img src={`${import.meta.env.VITE_REACT_APP_STATIC_PATH}/images/logo.png`} alt="ENT and Allergy" />
        </a>
      </div>
    </div>
  );
};

export default Header;
