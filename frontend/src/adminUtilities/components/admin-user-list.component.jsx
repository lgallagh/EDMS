import React, { useState, useEffect, useRef, useCallback } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import AdminUserInfo from "./admin-user-info.component";
import AdminOptions from "../../shared/data/adminData"
import { useLocation } from "react-router-dom";

const axiosService = new AxiosCalls();

const AdminUserList = () => {
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchType, setSearchType] = useState("sectionName");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
     //Pathname should match the parent route for reaching this component
     if(location.pathname == "/admin-utilities/manage-admin") {
      fetchAdminUsers();
     }
  }, [location.pathname]);

  const fetchAdminUsers = async () => {
    try {
      const response = await axiosService.postData("/adminUtilities/adminUsers/getAdminUserList");
      const filteredAdminUsers = response.data.map((adminUser, index) => ({
        id: adminUser.id,
    
    
        username: adminUser.username,
        section: adminUser.section,
        privilege: adminUser.privilege,
        created: adminUser.created,
        modified: adminUser.modified,
        status: adminUser.status,
        rowIndex: index + 1,

         // Adding the name for the section (application name) and privilege
        sectionName: AdminOptions.getApplicationNameById(adminUser.section),
        privilegeName: AdminOptions.getPrivilegeNameById(adminUser.privilege)
      }));
      setAdminUsers(filteredAdminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
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
      await axiosService.postData(`/adminUtilities/adminUsers/status`, {
        id,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchAdminUsers();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} adminUserId 
   */
  const handleDelete = async (adminUserId) => {
    if (window.confirm("Are you sure you want to delete this admin user?")) {
      try {
        console.log("Admin User Id to Delete:"+adminUserId);
        await axiosService.postData(`/adminUtilities/adminUsers/delete`, {
          adminUserId
        });
        fetchAdminUsers();
      } catch (error) {
        console.error("Error deleting admin user:", error);
      }
    }
  };





  /** Handle navigating to Edit page for a Admin User */
  const handleEditClick = (rowData) => {
    console.log("userData:", rowData);

    navigate(`/admin-utilities/manage-admin/edit/${rowData.id}`);
  };

    /** Handle navigating to Edit page for a County */
    const handleAddClick = () => {
  
      navigate(`/admin-utilities/manage-admin/add/`);
  };



  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/admin-utilities/manage-admin`);
  };

  const onRowPrepared = (e) => {
    if (e.rowType === "data") {
      e.rowElement.classList.add(e.rowIndex % 2 === 0 ? "even" : "odd");
    }
  };

  //For use with the search filter
  const loadSelectOptions = useCallback(async (type) => {
    try {
      if (type === "sectionName") {
       
        return AdminOptions.applicationOptions.map((application) => ({
          value: application.name,
          label: application.name
        }));
      } 
      return [];
    } catch (error) {
      console.error("Error loading select options:", error);
      return [];
    }
  }, []);

  const columns = [
    {
      caption: "#",
      width: "5%",
      cellTemplate: (container, options) => {
        const rowIndex = options.rowIndex + 1;
        container.textContent = rowIndex;
      },
    },
    { dataField: "username", caption: "Username", width: "20%" },
    { dataField: "sectionName", caption: "Application", width: "18%" },
    { dataField: "privilegeName", caption: "Privilege", width: "12%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "12%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "12%" },
    {
      dataField: "status",
      caption: "Status",
      width: "6%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
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
    { value: "sectionName", label: "Application" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Admin Users
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
              columnName="username"
            />

         

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={adminUsers}
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
                 // When using select search, do an exact match filter
                 if (searchValue !== "") {
                  const filterCondition = [searchType, "=", searchValue];
                  dataGrid.filter(filterCondition);
                }
                
              }}
              searchOptions={searchOptions}
              useSelect={true}              // enable select mode
              loadSelectOptions={loadSelectOptions}
            />
          </div>
        }
      />

      <Route
        path="/edit/:adminUserId"
        element={<AdminUserInfo onCancel={handleCancel} />}
      />
      <Route
        path="/add/"
        element={<AdminUserInfo onCancel={handleCancel} />}
      />
      
    </Routes>
  );
};

export default AdminUserList;
