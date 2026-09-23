import React, { useState, useEffect } from "react";

const SearchFilter = ({ 
  searchType, 
  searchValue, 
  onSearchTypeChange, 
  onSearchValueChange, 
  onSearch, 
  searchOptions,
  useSelect = false,           // defaults to false, and can be ignored in pages that use textboxes instead
  loadSelectOptions = null     // function to load options (if useSelect is true)
}) => {
  const [selectOptions, setSelectOptions] = useState([]);

  // Whenever the searchType changes, load new options if using select
  useEffect(() => {
    if (useSelect && loadSelectOptions) {
      loadSelectOptions(searchType)
        .then((options) => {
          setSelectOptions(options);
        })
        .catch((error) => {
          console.error("Error loading select options:", error);
          setSelectOptions([]);
        });
    }
  }, [searchType, useSelect, loadSelectOptions]);

  return (
    <div className="search_section editable">
      <ul>
        <li>
          <div className="input select">
            <label htmlFor="SearchBy">Search By:</label>
            <select
              value={searchType}
              onChange={(e) => onSearchTypeChange(e.target.value)}
            >
              {searchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </li>
        <li>
          {useSelect ? (
            <div className="input select">
              <label htmlFor="SearchFor">Search For:</label>
              <select
                value={searchValue}
                onChange={(e) => onSearchValueChange(e.target.value)}
              >
                <option value="">Select</option>
                {selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="input text">
              <label htmlFor="SearchFor">Search For:</label>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchValueChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSearch();
                  }
                }}
              />
            </div>
          )}
        </li>
        <li>
          <button className="button" onClick={onSearch}>
            Search
          </button>
        </li>
      </ul>
    </div>
  );
};

export default SearchFilter;
