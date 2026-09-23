import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import LanguageInfo from "./language-info.component";
import { useLocation } from "react-router-dom";

const axiosService = new AxiosCalls();

const languageList = () => {
  const [languages, setlanguages] = useState([]);
  const [searchType, setSearchType] = useState("language");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/admin-utilities/language-list") {
      fetchlanguages();
    }
  }, [location.pathname]);

  const fetchlanguages = async () => {
    try {
      const response = await axiosService.postData("/adminUtilities/language/getLanguageList");
      const filteredlanguages = response.data.map((language, index) => ({
        id: language.id,
    
    
        language: language.language,
        created: language.created,
        modified: language.modified,
        rowIndex: index + 1,
      }));
      setlanguages(filteredlanguages);
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };



  /**
   * Handle clicking the Delete button for a row
   * @param {*} languageId 
   */
  const handleDelete = async (languageId) => {
    if (window.confirm("Are you sure you want to delete this language?")) {
      try {
        await axiosService.postData(`/adminUtilities/language/delete`, {
          languageId
        });
        fetchlanguages();
      } catch (error) {
        console.error("Error deleting language:", error);
      }
    }
  };





  /** Handle navigating to Edit page for a Language */
  const handleEditClick = (rowData) => {
    console.log("languageData:", rowData);

    navigate(`/admin-utilities/language-list/edit/${rowData.id}`);
  };

  /** Handle navigating to Edit page for a Language */
  const handleAddClick = () => {
    navigate(`/admin-utilities/language-list/add/`);
  };



  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/admin-utilities/language-list`);
  };

  const onRowPrepared = (e) => {
    if (e.rowType === "data") {
      e.rowElement.classList.add(e.rowIndex % 2 === 0 ? "even" : "odd");
    }
  };

  const columns = [
    {
      caption: "#",
      width: "5%",
      cellTemplate: (container, options) => {
        const rowIndex = options.rowIndex + 1;
        container.textContent = rowIndex;
      },
    },
    { dataField: "language", caption: "Language", width: "40%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "12%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "12%" },
  
    {
      caption: "Edit",
      width: "5%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
        const icon = document.createElement("i");
        icon.className = "fa fa-edit";
        icon.style.cursor = "pointer";
        icon.onclick = () => handleEditClick(options.data);;
        container.appendChild(icon);
      },
    },
    {
      caption: "Delete",
      width: "5%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
        const icon = document.createElement("i");
        icon.className = "fa fa-trash-o";
        icon.style.cursor = "pointer";
        icon.onclick = () => handleDelete(options.data.id);
        container.appendChild(icon);
      },
    },
  
  ];

  const searchOptions = [
    { value: "language", label: "Name" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Languages
                <span className="cont_heading_add">
                  <i className="fa fa-plus fa-2x" onClick={handleAddClick}></i>
                </span>
              </p>
            </div>

            <AlphabetFilter
              onFilter={(filter) => {
                const dataGrid = dataGridRef.current.instance();
                if (!filter) {
                  dataGrid.clearFilter();
                } else {
                  dataGrid.filter([[filter.column, "startswith", filter.value]]);
                }
              }}
              columnName="language"
            />


            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={languages}
              keyExpr="id"
              showBorders
              columnAutoWidth={true}
              columns={columns}
              onRowPrepared={onRowPrepared}
              showColumnLines={false}
            >
              <Paging defaultPageSize={20} />
            </DataGrid>
            </div>

            <SearchFilter
              searchType={searchType}
              searchValue={searchValue}
              onSearchTypeChange={setSearchType}
              onSearchValueChange={setSearchValue}
              onSearch={() => {
                const dataGrid = dataGridRef.current.instance();
                if (searchValue.trim()) {
                  const filterCondition =
                    searchType === "language"
                      ? [
                          ["language", "contains", searchValue]
                        ]
                      : [searchType, "contains", searchValue];
                  dataGrid.filter(filterCondition);
                }
              }}
              searchOptions={searchOptions}
            />
          </div>
        }
      />

      <Route
        path="/edit/:languageId"
        element={<LanguageInfo onCancel={handleCancel} />}
      />

      <Route
        path="/add/"
        element={<LanguageInfo onCancel={handleCancel} />}
      />
      
    </Routes>
  );
};

export default languageList;
