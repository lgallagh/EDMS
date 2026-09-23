import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import PhysicianAssistantInfo from "./physician-assistant-info.component";

const axiosService = new AxiosCalls();

const PhysicianAssistantDetailsList = () => {
  const [physicianAssistants, setPhysicianAssistants] = useState([]);
  const [searchType, setSearchType] = useState("doctor_first_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/physician-assistant-management/details") {
      fetchPhysicianAssistants();
    }
  }, [location.pathname]);

  const fetchPhysicianAssistants = async () => {
    try {
      const response = await axiosService.postData("/physicianAssistantManagement/physicianAssistants");
      const filteredPhysicianAssistants = response.data.map((physicianAssistant, index) => ({
        id: physicianAssistant.id,
        doctor_full_name:`${physicianAssistant.doctor_first_name} ${physicianAssistant.doctor_middle_name ? physicianAssistant.doctor_middle_name + " " : "" }${physicianAssistant.doctor_last_name}, ` + physicianAssistant.doctor_credential,
        doctor_first_name: physicianAssistant.doctor_first_name,
        doctor_middle_name: physicianAssistant.doctor_middle_name,
        doctor_last_name: physicianAssistant.doctor_last_name,
        NPI: physicianAssistant.NPI,
        speciality: physicianAssistant.speciality,
        created: physicianAssistant.created,
        modified: physicianAssistant.modified,
        is_virtual_visit: physicianAssistant.is_virtual_visit,
        is_active: physicianAssistant.is_active,
        vanity_url: physicianAssistant.vanity_url,
        rowIndex: index + 1,
      }));
      setPhysicianAssistants(filteredPhysicianAssistants);
    } catch (error) {
      console.error("Error fetching Physician Assistants:", error);
    }
  };

  /**
   * Handle clicking on one of the status cells
   * @param {*} doctorId 
   * @param {*} field 
   * @param {*} currentStatus 
   */
  const handleStatusChange = async (doctorId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/physicianAssistantManagement/physicianAssistants/status`, {
        doctorId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchPhysicianAssistants();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} doctorId 
   */
  const handleDelete = async (doctorId) => {
    if (window.confirm("Are you sure you want to delete this physician assistant?")) {
      try {
        await axiosService.postData(`/physicianAssistantManagement/physicianAssistants/delete`, {
          doctorId
        });
        fetchPhysicianAssistants();
      } catch (error) {
        console.error("Error deleting Physician Assistant:", error);
      }
    }
  };

  /** Handle navigating to Edit page for a Physician Assistant */
  const handleEditClick = (doctorId) => {
    navigate(`/physician-assistant-management/details/edit/${doctorId}`);
  };

  /** Handle navigating to adding a new Doctor */
  const handleAddClick = () => {
    navigate(`/physician-assistant-management/details/add`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/physician-assistant-management/details`);
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
    { dataField: "doctor_full_name", caption: "Doctor Name", width: "25%" },
    { dataField: "NPI", caption: "NPI", width: "10%" },
    { dataField: "speciality", caption: "Speciality", width: "10%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "doctor_first_name", visible: false },
    { dataField: "doctor_middle_name", visible: false },
    { dataField: "doctor_last_name", visible: false },
    {
      dataField: "is_active",
      caption: "Status",
      width: "5%",
      alignment: "center",

      cellTemplate: (container, options) => {
        if(options.data.is_active != "P") {
          const iconClass = options.data.is_active === "Y" ? "fa-check" : "fa-close";
          const icon = document.createElement("i");
          icon.className = `fa ${iconClass}`;
          icon.style.cursor = "pointer";
          icon.onclick = () =>
            handleStatusChange(options.data.id, "is_active", options.data.is_active);
          container.appendChild(icon);
        } else {
          const span = document.createElement("span");
          span.textContent = "P";
          span.className = "pending-active";
          span.style.cursor = "pointer";
          span.onclick = () => 
            handleStatusChange(options.data.id, "is_active", options.data.is_active);
          container.appendChild(span);
        }
      },
    },
    {
      caption: "Edit",
      width: "5%",
      alignment: "center",

      cellTemplate: (container, options) => {
        const icon = document.createElement("i");
        icon.className = "fa fa-edit";
        icon.style.cursor = "pointer";
        icon.onclick = () => handleEditClick(options.data.id);;
        container.appendChild(icon);
      },
    },
    {
      caption: "Delete",
      width: "5%",
      alignment: "center",

      cellTemplate: (container, options) => {
        const icon = document.createElement("i");
        icon.className = "fa fa-trash-o";
        icon.style.cursor = "pointer";
        icon.onclick = () => handleDelete(options.data.id);
        container.appendChild(icon);
      },
    },
    {
      caption: "URL",
      width: "5%",
      cellTemplate: (container, options) => {
        const link = document.createElement("a");
        link.href = `http://www.entandallergy.com/doctor/${options.data.vanity_url}#booking`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Booking";
        container.appendChild(link);
      },
    },
  ];

  const searchOptions = [
    { value: "doctor_first_name", label: "First Name" },
    { value: "doctor_middle_name", label: "Middle Name" },
    { value: "doctor_last_name", label: "Last Name" },
    { value: "NPI", label: "NPI" },
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Physician Assistants
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
              columnName="doctor_first_name"
            />

           
            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={physicianAssistants}
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
                    searchType === "doctor_full_name"
                      ? [
                          ["doctor_first_name", "contains", searchValue],
                          "or",
                          ["doctor_middle_name", "contains", searchValue],
                          "or",
                          ["doctor_last_name", "contains", searchValue],
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
        path="/edit/:doctorId"
        element={<PhysicianAssistantInfo onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<PhysicianAssistantInfo onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default PhysicianAssistantDetailsList;
