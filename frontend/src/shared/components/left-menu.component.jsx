import React, { useContext, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import menuData from "../data/menuData";
import { AuthContext } from "../context/auth.context";
import { useErrorContext } from "../context/error.context";

const LeftMenu = () => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { clearErrorMessage } = useErrorContext();
  const sectionRefs = useRef({});

  const [expandedSections, setExpandedSections] = useState({});
  const [selectedSections, setSelectedSections] = useState({});

  /**
   * Recursively find all parents of an active path.
   * This ensures all parents (including multi-level parents) are highlighted and expanded.
   */
  useEffect(() => {
    const expanded = {};
    const selected = {};

    const findActivePath = (items, parentIds = []) => {
      for (const item of items) {
        const newParentIds = [...parentIds, item.id]; // Track all ancestors

        if (item.items) {
          findActivePath(item.items, newParentIds);
        }

        if (item.path && location.pathname.startsWith(item.path)) {
          // Expand all parents leading to the active path
          newParentIds.forEach((id) => (expanded[id] = true));
          // Highlight the active path AND all its parents
          newParentIds.forEach((id) => (selected[id] = true));
        }
      }
    };

    menuData.forEach((section) => {
      if (section.items) {
        findActivePath(section.items, [section.id]);
      } else if (section.path && location.pathname.startsWith(section.path)) {
        expanded[section.id] = true;
        selected[section.id] = true;
      }
    });

    setExpandedSections(expanded);
    setSelectedSections(selected);
    clearErrorMessage();
  }, [location.pathname]);

  const toggleSection = useCallback((id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleNavigation = (path) => {
    if (location.pathname.startsWith(path)) {
      navigate("/", { replace: true });
      setTimeout(() => {
        navigate(path);
      }, 100);
    } else {
      navigate(path);
    }
  };

  const renderMenuItems = (items, parentId = null) => {
    return (
      <div
        ref={(el) => (sectionRefs.current[parentId] = el)}
        className="sub_content"
        style={{ height: expandedSections[parentId] ? "auto" : "0px" }}
      >
        {items.map((item) => (
          <div key={item.id} className={`left_nav_item`}>
            <h4>
              {item.items ? ( // If the item has children, make it expandable
                <span className={`clickable  ${selectedSections[item.id] ? "selected" : ""}`} onClick={() => toggleSection(item.id)}>
                  <span className="icon_before">
                    <i className={item.icon}></i>
                  </span>
                  {item.title}
                  <span className="icon_after">
                    <i className={`fa ${expandedSections[item.id] ? "fa-minus-square" : "fa-plus-square"}`}></i>
                  </span>
                </span>
              ) : (
                <span
                  className={`clickable ${selectedSections[item.id] ? "selected" : ""}`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="icon_before">
                    <i className={item.icon}></i>
                  </span>
                  {item.title}
                </span>
              )}
            </h4>

            {item.items && renderMenuItems(item.items, item.id)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="left_bar">
      <h2>General Control</h2>
      {menuData.map((section) => (
        <div key={section.id} className={`left_nav_sec ${selectedSections[section.id] ? "selected" : ""}`}>
          {section.items ? (
            <>
              <h4 onClick={() => toggleSection(section.id)}>
                <span className="icon_before">
                  <i className={section.icon}></i>
                </span>
                {section.title}
                <span className="icon_after">
                  <i className={`fa ${expandedSections[section.id] ? "fa-minus-square" : "fa-plus-square"}`}></i>
                </span>
              </h4>
              {renderMenuItems(section.items, section.id)}
            </>
          ) : section.action ? (
            <h4 onClick={() => section.action(logout)}>
              <span className="clickable">
                <span className="icon_before">
                  <i className={section.icon}></i>
                </span>
                {section.title}
              </span>
            </h4>
          ) : (
            <h4>
              <span
                className={`clickable ${selectedSections[section.id] ? "selected" : ""}`}
                onClick={() => handleNavigation(section.path)}
              >
                <span className="icon_before">
                  <i className={section.icon}></i>
                </span>
                {section.title}
              </span>
            </h4>
          )}
        </div>
      ))}
    </div>
  );
};

export default LeftMenu;
