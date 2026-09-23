import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import CountyInfo from "./county-info.component";
import { useLocation } from "react-router-dom";

const axiosService = new AxiosCalls();

const countyList = () => {
  const [counties, setCounties] = useState([]);
  const [searchType, setSearchType] = useState("display_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if(location.pathname == "/office-management/county-list") {
      fetchCounties();
    }
  }, [location.pathname]);

  const fetchCounties = async () => {
    try {
      const response = await axiosService.postData("/officeManagement/county/getCountyList");
      const filteredcounties = response.data.map((county, index) => ({
        id: county.id,

        state: county.state,
        display_name: county.display_name,
        vanity_url: county.vanity_url,
        created: county.created,
        modified: county.modified,
        rowIndex: index + 1,
      }));
      setCounties(filteredcounties);
    } catch (error) {
      console.error("Error fetching counties:", error);
    }
  };



  /**
   * Handle clicking the Delete button for a row
   * @param {*} countyId 
   */
  const handleDelete = async (countyId) => {
    if (window.confirm("Are you sure you want to delete this county?")) {
      try {
        await axiosService.postData(`/officeManagement/county/delete`, {
          countyId
        });
        fetchCounties();
      } catch (error) {
        console.error("Error deleting county:", error);
      }
    }
  };





  /** Handle navigating to Edit page for a County */
  const handleEditClick = (rowData) => {
    console.log("countyData:", rowData);

    navigate(`/office-management/county-list/edit/${rowData.id}`);
  };

    /** Handle navigating to Edit page for a County */
  const handleAddClick = () => {
  
      navigate(`/office-management/county-list/add/`);
  };



  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/office-management/county-list`);
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
    { dataField: "state", caption: "State", width: "15%" },
    { dataField: "display_name", caption: "Display Name", width: "20%" },
    { dataField: "vanity_url", caption: "Vanity Url", width: "25%" },
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
    { value: "display_name", label: "Display Name" },
    { value: "state", label: "State" },
    { value: "vanity_url", label: "Vanity Url" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Counties
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
              columnName="county"
            />

  

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={counties}
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
                    [searchType, "contains", searchValue];
                  dataGrid.filter(filterCondition);
                }
              }}
              searchOptions={searchOptions}
            />
          </div>
        }
      />

      <Route
        path="/edit/:countyId"
        element={<CountyInfo onCancel={handleCancel} />}
      />
      <Route
        path="/add/"
        element={<CountyInfo onCancel={handleCancel} />}
      />
      
    </Routes>
  );
};

export default countyList;
