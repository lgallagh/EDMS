import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import ImportComponent from "../../shared/components/import.component";
import OfficeInfo from "./office-info.component";
import dateFormat from "dateformat";
import { useLocation } from "react-router-dom";

const axiosService = new AxiosCalls();

const OfficeList = () => {
  const [offices, setOffices] = useState([]);
  const [searchType, setSearchType] = useState("office_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if(location.pathname == "/office-management/office-list") {
      fetchOffices();
    }
  }, [location.pathname]);

  const fetchOffices = async () => {
    try {
      const response = await axiosService.postData("/officeManagement/offices");
      const filteredOffices = response.data.map((office, index) => ({
        id: office.id,
        ref_number: index + 1,
        office_name: office.office_name,
        nextgen_id: office.nextgen_id,
        vanity_url: office.vanity_url,
        city: office.city,
        state: office.state,
        county: office.county_name,
        is_active: office.is_active,
        is_sleep: office.is_sleep,
      }));
      setOffices(filteredOffices);
    } catch (error) {
      console.error("Error fetching offices:", error);
    }
  };

  const handleStatusChange = async (officeId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/officeManagement/offices/status`, {
        officeId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchOffices();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEditClick = (officeId) => {
    navigate(`/office-management/office-list/edit/${officeId}`);
  };

  const handleAddClick = (officeId) => {
    navigate(`/office-management/office-list/add/`);
  };

  const handleDelete = async (officeId) => {
    if (window.confirm("Are you sure you want to delete this office?")) {
      try {
        await axiosService.postData(`/officeManagement/offices/delete`, { officeId });
        fetchOffices();
      } catch (error) {
        console.error("Error deleting office:", error);
      }
    }
  };
    /**
   * Handle clicking the Export link
   */
     const handleExport = async () => {
      try {
        const response = await axiosService.getData("/officeManagement/offices/export", {
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const now = new Date();
        const formattedDate = dateFormat(now, "yyyymmdd-HHMMss");
        link.setAttribute("download", `Office_List_${formattedDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
      } catch (error) {
        console.error("Error exporting data:", error);
      }
    };

    /** Handle navigating to Import page */
    const handleImportClick = () => {
      navigate(`/office-management/office-list/import`);
    };

    const handleCancel = () => {
      navigate(`/office-management/office-list`);
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
        const gridInstance = options.component;
        const pageSize = gridInstance.pageSize();
        const pageIndex = gridInstance.pageIndex();
        const rowIndex = pageIndex * pageSize + options.rowIndex + 1;
    
        container.textContent = rowIndex;
      },
    },
    { dataField: "office_name", caption: "Office Name", width: "15%" },
    { dataField: "nextgen_id", caption: "Nextgen ID", width: "15%" },
    { dataField: "vanity_url", caption: "Vanity URL", width: "10%" },
    { dataField: "city", caption: "City", width: "10%" },
    { dataField: "state", caption: "State", width: "8%" },
    { dataField: "county", caption: "County", width: "10%" },
    {
      dataField: "is_active",
      caption: "Status",
      width: "6%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
        if(options.data.is_active !== "P") {
          const iconClass = options.data.is_active === "Y" ? "fa-check" : "fa-close";
          const icon = document.createElement("i");
          icon.className = `fa ${iconClass}`;
          icon.style.cursor = "pointer";
          icon.onclick = () => handleStatusChange(options.data.id, "is_active", options.data.is_active);
          container.appendChild(icon);
        } else {
          const span = document.createElement("span");
          span.textContent = "P";
          span.className = "pending-active";
          span.style.cursor = "pointer";
          span.onclick = () => handleStatusChange(options.data.id, "is_active", options.data.is_active);
          container.appendChild(span);
        }
      },
    },
    {
      dataField: "is_sleep",
      caption: "Sleep Center",
      width: "6%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
        const iconClass = options.data.is_sleep === "Y" ? "fa-check" : "fa-close";
        const icon = document.createElement("i");
        icon.className = `fa ${iconClass}`;
        icon.style.cursor = "pointer";
        icon.onclick = () => handleStatusChange(options.data.id, "is_sleep", options.data.is_sleep);
        container.appendChild(icon);
      },
    },
    {
      caption: "Edit",
      width: "6%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
        const icon = document.createElement("i");
        icon.className = "fa fa-edit";
        icon.style.cursor = "pointer";
        icon.onclick = () => handleEditClick(options.data.id);
        container.appendChild(icon);
      },
    },
    {
      caption: "Delete",
      width: "6%",
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
    { value: "office_name", label: "Office Name" },
    { value: "nextgen_id", label: "Nextgen ID" },
    { value: "city", label: "City" },
    { value: "state", label: "State" }
  ];
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Offices
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
              columnName="office_name"
            />

            <div className="inside_area_ctn btm_gap">
                    <div className="pregination">
                      <div className="list_area">
                        <ul style={{ margin: 0 }}>
                          <li className="heading">
                            <div className="edit large_box">
                              <i className="fa fa-upload"></i>{" "}
                              <a href="#" 
                              onClick={(e) => {
                                e.preventDefault(); // Prevent default link behavior
                                handleExport();
                              }}>
                                Export
                              </a>
                            </div>
                            <div className="edit large_box import-button">
                              <i className="fa fa-download"></i>{" "}
                              <a href="#" onClick={(e) => {
                                e.preventDefault(); // Prevent default link behavior
                                handleImportClick();
                              }}>
                                Import
                              </a>
                            </div>
                           
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={offices}
              keyExpr="id"
              showBorders
              columnAutoWidth={true}
              columnMinWidth={100}
              columns={columns}
              onRowPrepared={onRowPrepared}
              wordWrapEnabled={true}
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
                    searchType === "office_name"
                      ? [
                          ["office_name", "contains", searchValue]
                          
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
        path="/import"
        element={<ImportComponent heading="Import Office Data" endpoint="/officeManagement/offices/import" onCancel={handleCancel} />}
      />
      <Route
        path="/edit/:officeId"
        element={<OfficeInfo onCancel={handleCancel} />}
      />

      <Route
        path="/add/"
        element={<OfficeInfo onCancel={handleCancel} />}
      />
     
    </Routes>
  );
};

export default OfficeList;
