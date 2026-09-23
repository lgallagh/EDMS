import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import ImportComponent from "../../shared/components/import.component";
import dateFormat from "dateformat";
import AudiologistDetails from "./audiologist-details.component";

const axiosService = new AxiosCalls();

const AudiologistDetailsList = () => {
  const [audiologists, setAudiologists] = useState([]);
  const [searchType, setSearchType] = useState("first_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/audiologist-management/details") {
      fetchAudiologists();
    }
  }, [location.pathname]);

  const fetchAudiologists = async () => {
    try {
      const response = await axiosService.postData("/audiologistManagement/audiologists");
      const filteredAudiologists = response.data.map((audiologist, index) => ({
        id: audiologist.id,
        full_name:`${audiologist.first_name} ${audiologist.middle_name ? audiologist.middle_name + " " : "" }${audiologist.last_name}, ` + audiologist.credential,
        first_name: audiologist.first_name,
        middle_name: audiologist.middle_name,
        last_name: audiologist.last_name,
        created: audiologist.created,
        modified: audiologist.modified,
        is_active: audiologist.is_active,
        vanity_url: audiologist.vanity_url,
        rowIndex: index + 1,
      }));
      setAudiologists(filteredAudiologists);
    } catch (error) {
      console.error("Error fetching audiologists:", error);
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
      await axiosService.postData(`/audiologistManagement/audiologists/status`, {
        professionalId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchAudiologists();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} professionalId 
   */
  const handleDelete = async (professionalId) => {
    if (window.confirm("Are you sure you want to delete this audiologist?")) {
      try {
        await axiosService.postData(`/audiologistManagement/audiologists/delete`, {
            professionalId
        });
        fetchAudiologists();
      } catch (error) {
        console.error("Error deleting audiologist:", error);
      }
    }
  };

  /**
   * Handle clicking the Export link
   */
  const handleExport = async () => {
    try {
      const response = await axiosService.getData("/audiologistManagement/audiologists/export", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const now = new Date();
      const formattedDate = dateFormat(now, "yyyymmdd-HHMMss");
      link.setAttribute("download", `Audiologists_${formattedDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };


  /** Handle navigating to Edit page for an Audiologist */
  const handleEditClick = (professionalId) => {
    navigate(`/audiologist-management/details/edit/${professionalId}`);
  };

  /** Handle navigating to adding a new Audiologist */
  const handleAddClick = () => {
    navigate(`/audiologist-management/details/add`);
  };

  /** Handle navigating to Import page */
  const handleImportClick = () => {
    navigate(`/audiologist-management/details/import`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/audiologist-management/details`);
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
    { dataField: "full_name", caption: "Audiologist Name", width: "25%" },
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
                Manage Audiologists
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
              dataSource={audiologists}
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
        path="/import"
        element={<ImportComponent heading="Import Audiologist Data" endpoint="/audiologistManagement/audiologists/import" onCancel={handleCancel} />}
      />
      <Route
        path="/edit/:professionalId"
        element={<AudiologistDetails onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<AudiologistDetails onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default AudiologistDetailsList;
