import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import DoctorServiceAltText from "./doctor-service-alt-text.component";

const axiosService = new AxiosCalls();

const DoctorServiceAltTextList = () => {
  const [doctorServiceAltTexts, setDoctorServiceAltTexts] = useState([]);
  const [searchType, setSearchType] = useState("doctor_first_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);

  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/doctor-management/doctor-service-alt-text") {
      fetchDoctors();
    }
  }, [location.pathname]);

  const fetchDoctors = async () => {
    try {
      const response = await axiosService.postData("/doctorManagement/doctor-service-alt-text");
      const filteredDoctorServiceAltTexts = response.data.map((doctor_office, index) => ({
        id: doctor_office.id,
        doctor_full_name:`${doctor_office.doctor_first_name} ${doctor_office.doctor_middle_name ? doctor_office.doctor_middle_name + " " : "" }${doctor_office.doctor_last_name}, ` + doctor_office.doctor_credential,
        office_name: doctor_office.office_name,
        created: doctor_office.created,
        modified: doctor_office.modified,
        rowIndex: index + 1,
      }));
      setDoctorServiceAltTexts(filteredDoctorServiceAltTexts);
    } catch (error) {
      console.error("Error fetching doctor service alt texts:", error);
    }
  };

  /** Handle navigating to Edit page for a Doctor Service Alt Text */
  const handleEditClick = (doctorId) => {
    navigate(`/doctor-management/doctor-service-alt-text/edit/${doctorId}`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/doctor-management/doctor-service-alt-text`);
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
    { dataField: "doctor_full_name", caption: "Doctor Name", width: "15%" },
    { dataField: "office_name", caption: "Offices Name", width: "15%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "15%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "15%" },
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
  ];

  const searchOptions = [
    { value: "doctor_full_name", label: "Doctor" },
    { value: "office_name", label: "Office" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Service Alternate Text
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
              columnName="doctor_full_name"
            />

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={doctorServiceAltTexts}
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
                  dataGrid.filter([searchType, "contains", searchValue]);
                }
              }}
              searchOptions={searchOptions}
            />
          </div>
        }
      />
      <Route
        path="/edit/:doctorOfficeId"
        element={<DoctorServiceAltText onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default DoctorServiceAltTextList;
