import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import SLPDetails from "./slp-details.component";

const axiosService = new AxiosCalls();

const SLPDetailsList = () => {
  const [slps, setSLPs] = useState([]);
  const [searchType, setSearchType] = useState("first_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/slp-management/details") {
      fetchSLPs();
    }
  }, [location.pathname]);

  const fetchSLPs = async () => {
    try {
      const response = await axiosService.postData("/slpManagement/slps");
      const filteredSLPs = response.data.map((slp, index) => ({
        id: slp.id,
        full_name:`${slp.first_name} ${slp.middle_name ? slp.middle_name + " " : "" }${slp.last_name}, ` + slp.credential,
        first_name: slp.first_name,
        middle_name: slp.middle_name,
        last_name: slp.last_name,
        created: slp.created,
        modified: slp.modified,
        is_active: slp.is_active,
        vanity_url: slp.vanity_url,
        rowIndex: index + 1,
      }));
      setSLPs(filteredSLPs);
    } catch (error) {
      console.error("Error fetching slps:", error);
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
      await axiosService.postData(`/slpManagement/slps/status`, {
        professionalId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchSLPs();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} professionalId 
   */
  const handleDelete = async (professionalId) => {
    if (window.confirm("Are you sure you want to delete this slp?")) {
      try {
        await axiosService.postData(`/slpManagement/slps/delete`, {
            professionalId
        });
        fetchSLPs();
      } catch (error) {
        console.error("Error deleting slp:", error);
      }
    }
  };


  /** Handle navigating to Edit page for an SLP */
  const handleEditClick = (professionalId) => {
    navigate(`/slp-management/details/edit/${professionalId}`);
  };

  /** Handle navigating to adding a new SLP */
  const handleAddClick = () => {
    navigate(`/slp-management/details/add`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/slp-management/details`);
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
    { dataField: "full_name", caption: "SLP Name", width: "25%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "first_name", visible: false },
    { dataField: "middle_name", visible: false },
    { dataField: "last_name", visible: false },
    {
      dataField: "is_active",
      caption: "Status",
      width: "5%",
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
                Manage SLPs
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
              dataSource={slps}
              keyExpr="id"
              showBorders
              columnAutoWidth={true}
              columns={columns}
              onRowPrepared={onRowPrepared}
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
        element={<SLPDetails onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<SLPDetails onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default SLPDetailsList;
