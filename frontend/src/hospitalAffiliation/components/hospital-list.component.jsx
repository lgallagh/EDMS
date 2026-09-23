import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import HospitalInfo from "./hospital-info.component";

const axiosService = new AxiosCalls();

const HospitalDetailsList = () => {
  const [hospitals, setHospitals] = useState([]);
  const [searchType, setSearchType] = useState("hospital_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/hospital-affiliation/hospital-list") {
      fetchHospitals();
    }
  }, [location.pathname]);

  const fetchHospitals = async () => {
    try {
      const response = await axiosService.postData("/hospitalAffiliation/hospitals");
      const filteredHospitals = response.data.map((hospital, index) => ({
        id: hospital.id,
        hospital_name: hospital.hospital_name,
        created: hospital.created,
        modified: hospital.modified,
        is_active: hospital.is_active,
        rowIndex: index + 1,
      }));
      setHospitals(filteredHospitals);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  /**
   * Handle clicking on one of the status cells
   * @param {*} hospitalId 
   * @param {*} field 
   * @param {*} currentStatus 
   */
  const handleStatusChange = async (hospitalId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/hospitalAffiliation/hospitals/status`, {
        hospitalId: hospitalId,
        field,
        status: newStatus,
      });
      fetchHospitals();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} hospitalId 
   */
  const handleDelete = async (hospitalId) => {
    if (window.confirm("Are you sure you want to delete this Hospital?")) {
      try {
        await axiosService.postData(`/hospitalAffiliation/hospitals/delete`, {
            hospitalId: hospitalId
        });
        fetchHospitals();
      } catch (error) {
        console.error("Error deleting hospital:", error);
      }
    }
  };


  /** Handle navigating to Edit page for a Hospital */
  const handleEditClick = (hospitalId) => {
    navigate(`/hospital-affiliation/hospital-list/edit/${hospitalId}`);
  };

  /** Handle navigating to adding a new Hospital */
  const handleAddClick = () => {
    navigate(`/hospital-affiliation/hospital-list/add`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/hospital-affiliation/hospital-list`);
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
    { dataField: "hospital_name", caption: "Hospital Name", width: "30%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "15%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "15%" },
    /* There's no status changing in the existing app, but leaving this here just in case
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
    },*/
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
    { value: "hospital_name", label: "Name" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Hospital
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
              columnName="hospital_name"
            />

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={hospitals}
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
        path="/edit/:hospitalId"
        element={<HospitalInfo onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<HospitalInfo onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default HospitalDetailsList;
