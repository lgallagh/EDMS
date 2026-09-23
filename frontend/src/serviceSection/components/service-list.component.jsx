import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import dateFormat from "dateformat";
import ServiceDetails from "./service-details.component";

const axiosService = new AxiosCalls();

const ServiceDetailsList = () => {
  const [services, setServices] = useState([]);
  const [originalServices, setOriginalServices] = useState([]);
  const [searchType, setSearchType] = useState("service_name");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);

  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/service-section/service-list") {
      fetchServices();
    }
  }, [location.pathname]);

  const fetchServices = async () => {
    try {
      const response = await axiosService.postData("/serviceSection/services");
      const filteredServices = response.data.map((service, index) => ({
        id: service.id,
        service_name: service.service_name,
        created: service.created,
        modified: service.modified,
        is_active: service.is_active,
        vanity_url: service.vanity_url,
        sort_order: service.sort_order,
        rowIndex: index + 1,
      }));
      setServices(filteredServices);
      setOriginalServices(filteredServices.map(r => ({ ...r })));
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  /**
   * Handle clicking on one of the status cells
   * @param {*} serviceId 
   * @param {*} field 
   * @param {*} currentStatus 
   */
  const handleStatusChange = async (serviceId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/serviceSection/services/status`, {
        serviceId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchServices();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} serviceId 
   */
  const handleDelete = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this Service?")) {
      try {
        await axiosService.postData(`/serviceSection/services/delete`, {
          serviceId
        });
        fetchServices();
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };


  /** Handle navigating to Edit page for an Service */
  const handleEditClick = (serviceId) => {
    navigate(`/service-section/service-list/edit/${serviceId}`);
  };

  /** Handle navigating to adding a new Service */
  const handleAddClick = () => {
    navigate(`/service-section/service-list/add`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/service-section/service-list`);
  };

  const onRowPrepared = (e) => {
    if (e.rowType === "data") {
      e.rowElement.classList.add(e.rowIndex % 2 === 0 ? "even" : "odd");
    }
  };

  const columns = [
    {
      caption: "",
      width: 30,
      allowSorting: false,
      allowFiltering: false,
      cellTemplate: (container, options) => {
        const icon = document.createElement("i");
        icon.className = "fa fa-crosshairs"; // Adjust icon as needed
        icon.style.fontSize = "18px";
        icon.style.cursor = "move";
        container.appendChild(icon);
      },
    },
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
    { dataField: "service_name", caption: "Service Name", width: "30%" },
    { dataField: "created", caption: "Created", dataType: "date", format: "MM/dd/yyyy hh:mm:ss", width: "15%" },
    { dataField: "modified", caption: "Last Modified", dataType: "date", format: "MM/dd/yyyy hh:mm:ss", width: "15%" },
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
    { value: "service_name", label: "Service Name" }
  ];


  const handleReorder = async (e) => {
    // Only do something if the row was actually moved.
    if (e.fromIndex === e.toIndex) return;
  
    const dataGrid = dataGridRef.current.instance();
  
    // Get the visible rows; this respects any filtering.
    const visibleRows = dataGrid.getVisibleRows().map((row) => row.data);
  
    // Create a copy of the visibleRows array.
    const newOrder = [...visibleRows];
  
    // Remove the item from its old position.
    const [movedItem] = newOrder.splice(e.fromIndex, 1);
    // Insert it at the new position.
    newOrder.splice(e.toIndex, 0, movedItem);
  
    // Update sort_order based on new ordering.
    const updatedRecords = newOrder.map((record, index) => ({
      ...record,
      sort_order: index + 1,
    }));
  
    // Update the state so that the grid re-renders.
    setServices(updatedRecords);
  
    // Then update the backend.
    try {
      await axiosService.postData(
        "/serviceSection/services/updateSortOrder",
        { updatedRecords, originalRecords: originalServices }
      );
      console.log("Sort order updated successfully.");
    } catch (error) {
      console.error("Error updating sort order:", error);
    }
  };
  
  

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Services
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
              columnName="service_name"
            />

            <div className="inside_area_ctn btm_gap">
            <DataGrid
              ref={dataGridRef}
              dataSource={services}
              keyExpr="id"
              showBorders
              columnAutoWidth={true}
              columns={columns}
              onRowPrepared={onRowPrepared}
              showColumnLines={false}
              rowDragging={{
                allowReordering: true,
                showDragIcons: false,  // Entire row becomes draggable
                onReorder: handleReorder,
              }}
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
        path="/edit/:serviceId"
        element={<ServiceDetails onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<ServiceDetails onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default ServiceDetailsList;
