import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import ImportComponent from "../../shared/components/import.component";
import DoctorInfo from "./doctor-info.component";
import dateFormat from "dateformat";

const axiosService = new AxiosCalls();

const DoctorDetailsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchType, setSearchType] = useState("doctor_first_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);

 const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/doctor-management/details") {
      fetchDoctors();
    }
  }, [location.pathname]);

  const fetchDoctors = async () => {
    try {
      const response = await axiosService.postData("/doctorManagement/doctors");
      const filteredDoctors = response.data.map((doctor, index) => ({
        id: doctor.id,
        doctor_full_name:`${doctor.doctor_first_name} ${doctor.doctor_middle_name ? doctor.doctor_middle_name + " " : "" }${doctor.doctor_last_name}, ` + doctor.doctor_credential,
        doctor_first_name: doctor.doctor_first_name,
        doctor_middle_name: doctor.doctor_middle_name,
        doctor_last_name: doctor.doctor_last_name,
        NPI: doctor.NPI,
        speciality: doctor.speciality,
        created: doctor.created,
        modified: doctor.modified,
        is_virtual_visit: doctor.is_virtual_visit,
        is_active: doctor.is_active,
        vanity_url: doctor.vanity_url,
        rowIndex: index + 1,
      }));
      setDoctors(filteredDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
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
      await axiosService.postData(`/doctorManagement/doctors/status`, {
        doctorId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchDoctors();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} doctorId 
   */
  const handleDelete = async (doctorId) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        await axiosService.postData(`/doctorManagement/doctors/delete`, {
          doctorId
        });
        fetchDoctors();
      } catch (error) {
        console.error("Error deleting doctor:", error);
      }
    }
  };

  /**
   * Handle clicking the Export link
   */
  const handleExport = async () => {
    try {
      const response = await axiosService.getData("/doctorManagement/doctors/export", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const now = new Date();
      const formattedDate = dateFormat(now, "yyyymmdd-HHMMss");
      link.setAttribute("download", `Doctor_List_${formattedDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  /**
   * Handle clicking the Download VCF link
   */
  const handleDownloadVCF = async () => {
    try {
      const response = await axiosService.getData("/doctorManagement/doctors/getVcfZipFile", {
        responseType: "blob", // Handle as a file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "all-doctors-archive.zip");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error downloading VCF:", error);
    }
  };

  /** Handle navigating to Edit page for a Doctor */
  const handleEditClick = (doctorId) => {
    navigate(`/doctor-management/details/edit/${doctorId}`);
  };

  /** Handle navigating to adding a new Doctor */
  const handleAddClick = () => {
    navigate(`/doctor-management/details/add`);
  };

  /** Handle navigating to Import page */
  const handleImportClick = () => {
    navigate(`/doctor-management/details/import`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/doctor-management/details`);
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
      dataField: "is_virtual_visit",
      caption: "Virtual Visit",
      width: "5%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
        const iconClass = options.data.is_virtual_visit === "Y" ? "fa-check" : "fa-close";
        const icon = document.createElement("i");
        icon.className = `fa ${iconClass}`;
        icon.style.cursor = "pointer";
        icon.onclick = () =>
          handleStatusChange(options.data.id, "is_virtual_visit", options.data.is_virtual_visit);
        container.appendChild(icon);
      },
    },
    {
      dataField: "is_active",
      caption: "Status",
      width: "5%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
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
        container.style.textAlign = "center";
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
        container.style.textAlign = "center";
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
                Manage Doctors
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
                            <div className="edit large_box">
                              <i className="fa fa-file-code-o"></i>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault(); // Prevent default link behavior
                                  handleDownloadVCF();
                                }}
                              >
                                Download VCF
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
              dataSource={doctors}
              keyExpr="id"
              showBorders
              columnAutoWidth={true}
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
        path="/import"
        element={<ImportComponent heading="Import Doctor Data" endpoint="/doctorManagement/doctors/import" onCancel={handleCancel} />}
      />
      <Route
        path="/edit/:doctorId"
        element={<DoctorInfo onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<DoctorInfo onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default DoctorDetailsList;
