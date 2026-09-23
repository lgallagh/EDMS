import React, { useState, useEffect, useRef, useCallback } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import HospitalAffiliationInfo from "./hospital-affiliation-info.component";
import dateFormat from "dateformat";

const axiosService = new AxiosCalls();

const HospitalAffiliationList = () => {
  const [hospitalAffiliations, setHospitalAffiliations] = useState([]);
  const [searchType, setSearchType] = useState("doctor_id");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/hospital-affiliation/hospital-affiliation-list") {
      fetchHospitalAffiliations();
    }
  }, [location.pathname]);

  const fetchHospitalAffiliations = async () => {
    try {
      const response = await axiosService.postData("/hospitalAffiliation/hospitalAffiliations");
      const filteredHospitalAffiliations = response.data.map((hospitalAffiliation, index) => ({
        id: hospitalAffiliation.id,
        hospital_id: hospitalAffiliation.hospital_id,
        hospital_name: hospitalAffiliation.hospital_name,
        doctor_id: hospitalAffiliation.doctor_id,
        doctor: hospitalAffiliation.doctor,
        privilege_start_date: hospitalAffiliation.privilege_start_date,
        privilege_end_date: hospitalAffiliation.privilege_end_date,
        staff_status: hospitalAffiliation.staff_status,
        rowIndex: index + 1,
      }));
      setHospitalAffiliations(filteredHospitalAffiliations);
    } catch (error) {
      console.error("Error fetching hospital affiliationss:", error);
    }
  };


  /**
   * Handle clicking the Delete button for a row
   * @param {*} hospitalAffiliationId 
   */
  const handleDelete = async (hospitalAffiliationId) => {
    if (window.confirm("Are you sure you want to delete this Hospital Affiliation?")) {
      try {
        await axiosService.postData(`/hospitalAffiliation/hospitalAffiliations/delete`, {
            hospitalAffiliationId
        });
        fetchHospitalAffiliations();
      } catch (error) {
        console.error("Error deleting hospital affiliation:", error);
      }
    }
  };

  /**
   * Handle clicking the Export link
   */
   const handleExport = async () => {
    try {
      const response = await axiosService.getData("/hospitalAffiliation/hospitalAffiliations/export", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const now = new Date();
      const formattedDate = dateFormat(now, "yyyymmdd-HHMMss");
      link.setAttribute("download", `Hospital_List_${formattedDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };


  /** Handle navigating to Edit page for a Hospital Affiliation */
  const handleEditClick = (hospitalAffiliationId) => {
    navigate(`/hospital-affiliation/hospital-affiliation-list/edit/${hospitalAffiliationId}`);
  };

  /** Handle navigating to adding a new Hospital Affiliation */
  const handleAddClick = () => {
    navigate(`/hospital-affiliation/hospital-affiliation-list/add`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/hospital-affiliation/hospital-affiliation-list`);
  };

  const onRowPrepared = (e) => {
    if (e.rowType === "data") {
      e.rowElement.classList.add(e.rowIndex % 2 === 0 ? "even" : "odd");
    }
  };

  //For use with the search filter
  const loadSelectOptions = useCallback(async (type) => {
    try {
      if (type === "doctor_id") {
        const response = await axiosService.getData("/lists/doctorList");
        // Map the response to an array of options with value/label properties
        return response.data.map((doctor) => ({
          value: doctor.id,
          label: doctor.doctor_first_name + " " +
            (doctor.doctor_middle_name ? doctor.doctor_middle_name + " " : "") +
            doctor.doctor_last_name + ", " + doctor.doctor_credential
        }));
      } else if (type === "hospital_id") {
        const response = await axiosService.getData("/lists/hospitalList");
        return response.data.map((hospital) => ({
          value: hospital.id,
          label: hospital.hospital_name,
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
        const gridInstance = options.component;
        const pageSize = gridInstance.pageSize();
        const pageIndex = gridInstance.pageIndex();
        const rowIndex = pageIndex * pageSize + options.rowIndex + 1;
    
        container.textContent = rowIndex;
      },
    },
    { dataField: "hospital_name", caption: "Hospital", width: "30%" },
    { dataField: "doctor", caption: "Doctor", width: "20%" },
    { dataField: "privilege_start_date", caption: "Start Date", dataType: "date", format: "MM/dd/yyyy", width: "15%" },
    { dataField: "privilege_end_date", caption: "End Date", dataType: "date", format: "MM/dd/yyyy", width: "15%" },
    { dataField: "staff_status", caption: "Status", width: "10%" },
    { dataField: "doctor_id", visible: false },
    { dataField: "hospital_id", visible: false },
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
    { value: "doctor_id", label: "Doctor Name" },
    { value: "hospital_id", label: "Hospital Name" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Affiliation
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
                                    </li>
                                    </ul>
                                </div>
                                </div>
                            </div>
            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={hospitalAffiliations}
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
        path="/edit/:hospitalAffiliationId"
        element={<HospitalAffiliationInfo onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<HospitalAffiliationInfo onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default HospitalAffiliationList;
