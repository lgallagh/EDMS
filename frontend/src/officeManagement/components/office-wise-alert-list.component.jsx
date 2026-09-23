import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import OfficeWiseAlertInfo from "./office-wise-alert-info.component";
import { useLocation } from "react-router-dom";

const axiosService = new AxiosCalls();

const OfficeWiseAlertList = () => {
  const [officeWiseAlerts, setOfficeWiseAlerts] = useState([]);
  const [searchType, setSearchType] = useState("office_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if(location.pathname == "/office-management/office-wise-alert") {
      fetchOfficeWiseAlerts();
    }
  }, [location.pathname]);

  const fetchOfficeWiseAlerts = async () => {
    try {
      const response = await axiosService.postData("/officeManagement/officeWiseAlert/getOfficeWiseAlertList");
      const filteredofficeWiseAlerts = response.data.map((officeWiseAlert, index) => ({
        id: officeWiseAlert.id,
        office_id: officeWiseAlert.office_id,
        office_name: officeWiseAlert.office_name,
        message: officeWiseAlert.message,
        start_time: officeWiseAlert.start_time,
        end_time: officeWiseAlert.end_time,
        status: officeWiseAlert.status,
        modified: officeWiseAlert.modified,
        createdAt: officeWiseAlert.created,
        rowIndex: index + 1,
      }));
      setOfficeWiseAlerts(filteredofficeWiseAlerts);
    } catch (error) {
      console.error("Error fetching officeWiseAlerts:", error);
    }
  };



  /**
   * Handle clicking the Delete button for a row
   * @param {*} officeWiseAlertId 
   */
  const handleDelete = async (officeWiseAlertId) => {
    if (window.confirm("Are you sure you want to delete this officeWiseAlert?")) {
      try {
        await axiosService.postData(`/officeManagement/officeWiseAlert/delete`, {
          officeWiseAlertId
        });
        fetchOfficeWiseAlerts();
      } catch (error) {
        console.error("Error deleting officeWiseAlert:", error);
      }
    }
  };

  /**
   * Handle clicking on one of the status cells
   * @param {*} id 
   * @param {*} field 
   * @param {*} currentStatus 
   */
   const handleStatusChange = async (id, field, currentStatus) => {
    const newStatus = currentStatus === "A" ? "I" : "A";
    try {
      await axiosService.postData(`/officeManagement/officeWiseAlert/status`, {
        id,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchOfficeWiseAlerts();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };



  /** Handle navigating to Edit page for a OfficeWiseAlert */
  const handleEditClick = (rowData) => {
    console.log("officeWiseAlertData:", rowData);

    navigate(`/office-management/office-wise-alert/edit/${rowData.id}`);
  };

    /** Handle navigating to Edit page for a OfficeWiseAlert */
  const handleAddClick = () => {
  
      navigate(`/office-management/office-wise-alert/add/`);
  };



  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/office-management/office-wise-alert`);
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
    { dataField: "office_name", caption: "Office", width: "25%" },
    { dataField: "message", caption: "Message", width: "20%" },
    { dataField: "start_time", caption: "Starts", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "end_time", caption: "Ends", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "10%" },

    {
      dataField: "status",
      caption: "Status",
      width: "6%",
      alignment: "center",

      cellTemplate: (container, options) => {
       
          const iconClass = options.data.status === "A" ? "fa-check" : "fa-close";
          const icon = document.createElement("i");
          icon.className = `fa ${iconClass}`;
          icon.style.cursor = "pointer";
          icon.onclick = () =>
            handleStatusChange(options.data.id, "status", options.data.status);
          container.appendChild(icon);
        
      },
    },
  
    {
      caption: "Edit",
      width: "6%",
      alignment: "center",

      cellTemplate: (container, options) => {
        const icon = document.createElement("i");
        icon.className = "fa fa-edit";
        icon.style.cursor = "pointer";
        icon.onclick = () => handleEditClick(options.data);;
        container.appendChild(icon);
      },
    },
    {
      caption: "Delete",
      width: "6%",
      alignment: "center",

      cellTemplate: (container, options) => {
        const icon = document.createElement("i");
        icon.className = "fa fa-trash-o";
        icon.style.cursor = "pointer";
        icon.onclick = () => handleDelete(options.data.id);
        container.appendChild(icon);
      },
    },
  
  ];

  const searchOptions = [
    { value: "office_name", label: "Office Name" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage OfficeWiseAlerts
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
            <DataGrid
              ref={dataGridRef}
              dataSource={officeWiseAlerts}
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
        path="/edit/:officeWiseAlertId"
        element={<OfficeWiseAlertInfo onCancel={handleCancel} />}
      />
      <Route
        path="/add/"
        element={<OfficeWiseAlertInfo onCancel={handleCancel} />}
      />
      
    </Routes>
  );
};

export default OfficeWiseAlertList;
