import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import CMSContent from "./cms-content.component";

const axiosService = new AxiosCalls();

const CMSContentList = () => {
  const [cmsContents, setCMSContents] = useState([]);
  const [searchType, setSearchType] = useState("title");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/under-cms/content-list") {
      fetchCMSContent();
    }
  }, [location.pathname]);

  const fetchCMSContent = async () => {
    try {
      const response = await axiosService.postData("/underCms/cms");
      const filteredCMSContents = response.data.map((cms, index) => ({
        id: cms.id,
        title: cms.title,
        created: cms.created,
        modified: cms.modified,
        is_active: cms.is_active,
        vanity_url: cms.vanity_url,
        rowIndex: index + 1,
      }));
      setCMSContents(filteredCMSContents);
    } catch (error) {
      console.error("Error fetching CMS Content:", error);
    }
  };

  /**
   * Handle clicking on one of the status cells
   * @param {*} cmsId 
   * @param {*} field 
   * @param {*} currentStatus 
   */
  const handleStatusChange = async (cmsId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/underCms/cms/status`, {
        cmsId: cmsId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchCMSContent();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} cmsId 
   */
  const handleDelete = async (cmsId) => {
    if (window.confirm("Are you sure you want to delete this CMS Content?")) {
      try {
        await axiosService.postData(`/underCms/cms/delete`, {
            cmsId: cmsId
        });
        fetchCMSContent();
      } catch (error) {
        console.error("Error deleting CMS Content:", error);
      }
    }
  };


  /** Handle navigating to Edit page for CMS Content */
  const handleEditClick = (cmsId) => {
    navigate(`/under-cms/content-list/edit/${cmsId}`);
  };

  /** Handle navigating to adding a new SLP */
  const handleAddClick = () => {
    navigate(`/under-cms/content-list/add`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/under-cms/content-list`);
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
    { dataField: "title", caption: "CMS Page Title", width: "25%" },
    { dataField: "vanity_url", caption: "Vanity URL", width: "25%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
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
    { value: "title", label: "CMS Page Title" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage CMS Page
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
              columnName="title"
            />

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={cmsContents}
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
        path="/edit/:cmsId"
        element={<CMSContent onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<CMSContent onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default CMSContentList;
