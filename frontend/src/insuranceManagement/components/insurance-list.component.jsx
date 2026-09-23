import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import ImportComponent from "../../shared/components/import.component";
import InsuranceInfo from "./insurance-info.component";
import dateFormat from "dateformat";
import { useLocation } from "react-router-dom";


const axiosService = new AxiosCalls();

const InsuranceList = () => {
  const [insurances, setInsurances] = useState([]);
  const [searchType, setSearchType] = useState("insurance_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();


  useEffect(() => {
    if(location.pathname == "/insurance-management/insurance-list") {
      fetchInsurances();
    }
  }, [location.pathname]);

  const fetchInsurances = async () => {
    try {
      const response = await axiosService.postData("/insuranceManagement/insurances");
      const filteredInsurances = response.data.map((insurance, index) => ({
        id: insurance.id,
        ref_number: index + 1,
        insurance_name: insurance.insurance_name,
        starting_date: insurance.starting_date,
        deactivate_date: insurance.deactivate_date,
        vanity_url: insurance.vanity_url,
        is_goldenrule: insurance.is_goldenrule,
        is_active: insurance.is_active,
        created: insurance.created,
        modified: insurance.modified
      }));
      setInsurances(filteredInsurances);
    } catch (error) {
      console.error("Error fetching insurances:", error);
    }
  };

  const handleStatusChange = async (insuranceId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/insuranceManagement/insurances/status`, {
        insuranceId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchInsurances();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEditClick = (insuranceId) => {
    navigate(`/insurance-management/insurance-list/edit/${insuranceId}`);
  };

  const handleAddClick = (insuranceId) => {
    navigate(`/insurance-management/insurance-list/add/`);
  };

  const handleDelete = async (insuranceId) => {
    if (window.confirm("Are you sure you want to delete this insurance?")) {
      try {
        await axiosService.postData(`/insuranceManagement/insurances/delete`, { insuranceId });
        fetchInsurances();
      } catch (error) {
        console.error("Error deleting insurance:", error);
      }
    }
  };
    /**
   * Handle clicking the Export link
   */
     const handleExport = async () => {
      try {
        const response = await axiosService.getData("/insuranceManagement/insurances/export", {
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const now = new Date();
        const formattedDate = dateFormat(now, "yyyymmdd-HHMMss");
        link.setAttribute("download", `Insurance_List_${formattedDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
      } catch (error) {
        console.error("Error exporting data:", error);
      }
    };

    /** Handle navigating to Import page */
    const handleImportClick = () => {
      navigate(`/insurance-management/insurance-list/import`);
    };

    const handleCancel = () => {
      navigate(`/insurance-management/insurance-list`);
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
    { dataField: "insurance_name", caption: "Insurance Name", width: "30%" },
    { dataField: "created", caption: "Created", width: "15%",dataType: "date", format: "MM/dd/yyyy" },
    { dataField: "modified", caption: "Modified", width: "15%", dataType: "date", format: "MM/dd/yyyy" },
    {
      dataField: "is_active",
      caption: "Status",
      width: "6%",
      alignment: "center",
      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
        if(options.data.is_active !== "P") {
          const iconClass = options.data.is_active === "Y" ? "fa-check" : "fa-close";
          const icon = document.createElement("i");
          icon.className = `fa ${iconClass}`;
          icon.style.cursor = "pointer";
          icon.onclick = () => handleStatusChange(options.data.id, "is_active", options.data.is_active);
          container.appendChild(icon);
        } else {
          const span = document.createElement("span");
          span.textContent = "P";
          span.className = "pending-active";
          span.style.cursor = "pointer";
          span.onclick = () => handleStatusChange(options.data.id, "is_active", options.data.is_active);
          container.appendChild(span);
        }
      },
    },
    {
      dataField: "is_goldenrule",
      caption: "Show In Goldenrule",
      width: "10%",
      alignment: "center",

      cellTemplate: (container, options) => {
        container.style.textAlign = "center";
        const iconClass = options.data.is_goldenrule === "Y" ? "fa-check" : "fa-close";
        const icon = document.createElement("i");
        icon.className = `fa ${iconClass}`;
        icon.style.cursor = "pointer";
        icon.onclick = () => handleStatusChange(options.data.id, "is_goldenrule", options.data.is_goldenrule);
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
    { value: "insurance_name", label: "Name" }
  ];
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Insurances
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
              columnName="insurance_name"
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
                           
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={insurances}
              keyExpr="id"
              showBorders
              columnAutoWidth={true}
              columnMinWidth={100}
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
        path="/import"
        element={<ImportComponent heading="Import Insurance Data" endpoint="/insuranceManagement/insurances/import" onCancel={handleCancel} />}
      />
      <Route
        path="/edit/:insuranceId"
        element={<InsuranceInfo onCancel={handleCancel} />}
      />

      <Route
        path="/add/"
        element={<InsuranceInfo onCancel={handleCancel} />}
      />
     
    </Routes>
  );
};

export default InsuranceList;
