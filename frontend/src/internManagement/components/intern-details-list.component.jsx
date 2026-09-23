import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import InternDetails from "./intern-details.component";

const axiosService = new AxiosCalls();

const InternDetailsList = () => {
  const [interns, setInterns] = useState([]);
  const [searchType, setSearchType] = useState("first_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/intern-management/details") {
      fetchInterns();
    }
  }, [location.pathname]);

  const fetchInterns = async () => {
    try {
      const response = await axiosService.postData("/internManagement/interns");
      const filteredInterns = response.data.map((intern, index) => ({
        id: intern.id,
        full_name:`${intern.first_name} ${intern.middle_name ? intern.middle_name + " " : "" }${intern.last_name}`,
        first_name: intern.first_name,
        middle_name: intern.middle_name,
        last_name: intern.last_name,
        created: intern.created,
        modified: intern.modified,
        is_active: intern.is_active,
        vanity_url: intern.vanity_url,
        rowIndex: index + 1,
      }));
      setInterns(filteredInterns);
    } catch (error) {
      console.error("Error fetching interns:", error);
    }
  };

  /**
   * Handle clicking on one of the status cells
   * @param {*} professionalId 
   * @param {*} field 
   * @param {*} currentStatus 
   */
  const handleStatusChange = async (professionalId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/internManagement/interns/status`, {
        professionalId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchInterns();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} professionalId 
   */
  const handleDelete = async (professionalId) => {
    if (window.confirm("Are you sure you want to delete this intern?")) {
      try {
        await axiosService.postData(`/internManagement/interns/delete`, {
            professionalId
        });
        fetchInterns();
      } catch (error) {
        console.error("Error deleting intern:", error);
      }
    }
  };


  /** Handle navigating to Edit page for an Intern */
  const handleEditClick = (professionalId) => {
    navigate(`/intern-management/details/edit/${professionalId}`);
  };

  /** Handle navigating to adding a new Intern */
  const handleAddClick = () => {
    navigate(`/intern-management/details/add`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/intern-management/details`);
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
    { dataField: "full_name", caption: "Intern Name", width: "25%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "first_name", visible: false },
    { dataField: "middle_name", visible: false },
    { dataField: "last_name", visible: false },
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
    }
  ];

  const searchOptions = [
    { value: "first_name", label: "First Name" },
    { value: "middle_name", label: "Middle Name" },
    { value: "last_name", label: "Last Name" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Interns
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
              columnName="first_name"
            />

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={interns}
              keyExpr="id"
              showBorders
              columnAutoWidth={true}
              columns={columns}
              onRowPrepared={onRowPrepared}
              showColumnLines={false}
            >
              <Paging defaultPageSize={30} />
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
                    searchType === "full_name"
                      ? [
                          ["first_name", "contains", searchValue],
                          "or",
                          ["middle_name", "contains", searchValue],
                          "or",
                          ["last_name", "contains", searchValue],
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
        path="/edit/:professionalId"
        element={<InternDetails onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<InternDetails onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default InternDetailsList;
