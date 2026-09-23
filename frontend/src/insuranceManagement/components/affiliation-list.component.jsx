import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import {useParams, Routes, Route, useNavigate } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import AffiliationInfo from "./affiliation-info.component";
import dateFormat from "dateformat";
import { useLocation } from "react-router-dom";

const axiosService = new AxiosCalls();

const AffiliationList = () => {
  const { type } = useParams();
  const [affiliations, setAffiliations] = useState([]);
  const [searchType, setSearchType] = useState("affiliation_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();
  const labelMapping = {
    doctor: "Doctor",
    audiologist: "Audiologist",
    PA: "Physician Assistant"
  };

  useEffect(() => {
    console.log(`Affiliation Type:${type}`)
    if(location.pathname == "/insurance-management/affiliation/doctor" ||
       location.pathname == "/insurance-management/affiliation/audiologist" ||
       location.pathname == "/insurance-management/affiliation/PA") {
     fetchAffiliations();
    }
  
  }, [location.pathname]);

  const fetchAffiliations = async () => {
    try {
      const response = await axiosService.postData("/insuranceManagement/affiliations",
      {
        type
      });
      const filteredAffiliations = response.data.map((affiliation, index) => ({
        id: affiliation.id,
        insurance_id: affiliation.insurance_id,
        insurance_name: affiliation.insurance_name,
        doctor_id: affiliation.doctor_id,
        provider: affiliation.provider,
        office_id: affiliation.office_id,
        office_name: affiliation.office_name,
        plan_id: affiliation.plan_id,
        plan_name: affiliation.plan_name,
        plan_details: affiliation.plan_details,
        starting_date: affiliation.starting_date,
        deactivate_date: affiliation.deactivate_date,
        created: affiliation.created,
        modified: affiliation.modified
      }));
      
      setAffiliations(filteredAffiliations);
    } catch (error) {
      console.error("Error fetching affiliations:", error);
    }
  };

  const handleStatusChange = async (affiliationId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/insuranceManagement/affiliations/status`, {
        affiliationId,
        field,
        status: newStatus,
      });
      fetchAffiliations();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEditClick = (affiliationId) => {
    navigate(`/insurance-management/affiliation/${type}/edit/${affiliationId}`);
  };

  const handleAddClick = (affiliationId) => {
    navigate(`/insurance-management/affiliation/${type}/add/`);
  };

  const handleDelete = async (affiliationId) => {
    if (window.confirm("Are you sure you want to delete this affiliation?")) {
      try {
        await axiosService.postData(`/insuranceManagement/affiliations/delete`, { affiliationId, type });
        fetchAffiliations();
      } catch (error) {
        console.error("Error deleting affiliation:", error);
      }
    }
  };
    /**
   * Handle clicking the Export link
   */
     const handleExport = async () => {
      try {
        const response = await axiosService.getData("/insuranceManagement/affiliations/export", {
          responseType: "blob",
          params: {
            type: type
          }
        }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const now = new Date();
        const formattedDate = dateFormat(now, "yyyymmdd-HHMMss");
        link.setAttribute("download", `Affiliation_List_${formattedDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
      } catch (error) {
        console.error("Error exporting data:", error);
      }
    };


    const handleCancel = () => {
      navigate(`/insurance-management/affiliation/${type}`);
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
    { dataField: "insurance_name", caption: "Insurance", width: "25%" },
    { dataField: "provider", caption: "Doctor", width: "20%" },
    { dataField: "office_name", caption: "Office", width: "20%" },
    { dataField: "plan_name", caption: "Plan", width: "20%" },
    { dataField: "starting_date", caption: "Start Date", width: "15%",dataType: "date", format: "MM/dd/yyyy" },
    { dataField: "deactivate_date", caption: "End Date", width: "15%", dataType: "date", format: "MM/dd/yyyy" },
  
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
    { value: "provider",      label: labelMapping[type] },
    { value: "insurance_name",label: "Insurance"},
    { value: "office_name",   label: "Office"}

  ];
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Affiliations
                {/* <span className="cont_heading_add">
                  <i className="fa fa-plus fa-2x" onClick={handleAddClick}></i>
                </span> */}
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
              columnName="affiliation_name"
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
              dataSource={affiliations}
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
        path="/edit/:affiliationId"
        element={<AffiliationInfo onCancel={handleCancel} />}
      />

      <Route
        path="/add/"
        element={<AffiliationInfo onCancel={handleCancel} />}
      />
     
    </Routes>
  );
};

export default AffiliationList;
