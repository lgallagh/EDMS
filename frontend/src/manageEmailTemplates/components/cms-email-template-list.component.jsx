import React, { useState, useEffect, useRef } from "react";
import DataGrid, { Paging } from "devextreme-react/data-grid";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AxiosCalls from "../../shared/services/axios-calls.service";
import SearchFilter from "../../shared/components/search-filter.component";
import AlphabetFilter from "../../shared/components/alphabet-filter.component";
import EmailTemplateInfo from "./email-template-info.component";

const axiosService = new AxiosCalls();

const EmailTemplateList = () => {
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [searchType, setSearchType] = useState("title");
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    //Pathname should match the parent route for reaching this component
    if(location.pathname == "/manage-email-templates/cms-email-template-list") {
      fetchEmailTemplates();
    }
  }, [location.pathname]);

  const fetchEmailTemplates = async () => {
    try {
      const response = await axiosService.postData("/manageEmailTemplates/emailTemplates");
      const filteredEmailTemplates = response.data.map((emailTemplate, index) => ({
        id: emailTemplate.id,
        title: emailTemplate.title,
        to_person: emailTemplate.to_person,
        from_person: emailTemplate.from_person,
        cc: emailTemplate.cc,
        subject_line: emailTemplate.subject_line,
        body_text: emailTemplate.body_text,
        create_date: emailTemplate.create_date,
        is_active: emailTemplate.is_active,
        email_type: emailTemplate.email_type,
        rowIndex: index + 1,
      }));
      setEmailTemplates(filteredEmailTemplates);
    } catch (error) {
      console.error("Error fetching Email Templates:", error);
    }
  };

  /**
   * Handle clicking on one of the status cells
   * @param {*} emailTemplateId 
   * @param {*} field 
   * @param {*} currentStatus 
   */
  const handleStatusChange = async (emailTemplateId, field, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    try {
      await axiosService.postData(`/manageEmailTemplates/emailTemplates/status`, {
        emailTemplateId,
        field,
        status: newStatus,
        oldStatus: currentStatus
      });
      fetchEmailTemplates();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  /**
   * Handle clicking the Delete button for a row
   * @param {*} emailTemplateId 
   */
  const handleDelete = async (emailTemplateId) => {
    if (window.confirm("Are you sure you want to delete this Email Template?")) {
      try {
        await axiosService.postData(`/manageEmailTemplates/emailTemplates/delete`, {
          emailTemplateId
        });
        fetchEmailTemplates();
      } catch (error) {
        console.error("Error deleting Email Template:", error);
      }
    }
  };

  /** Handle navigating to Edit page for a Email Template */
  const handleEditClick = (emailTemplateId) => {
    navigate(`/manage-email-templates/cms-email-template-list/edit/${emailTemplateId}`);
  };

  /** Handle navigating to adding a new Doctor */
  const handleAddClick = () => {
    navigate(`/manage-email-templates/cms-email-template-list/add`);
  };

  /** Callback function to handle returning to this route */
  const handleCancel = () => {
    navigate(`/manage-email-templates/cms-email-template-list`);
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
    { dataField: "title", caption: "EmailTemplates Title", width: "25%" },
    { dataField: "subject_line", caption: "Subject", width: "25%" },
    { dataField: "email_type", caption: "Type", width: "15%" },
    { dataField: "create_date", caption: "Created", dataType: "date", format: "MM/dd/yyyy", width: "10%" },
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
    { value: "title", label: "Email Templates Title" }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <div className="inside_area_ctn btm_gap">
              <p className="cont_heading">
                Manage Email Templates
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
              dataSource={emailTemplates}
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
                  const filterCondition = [searchType, "contains", searchValue];
                  dataGrid.filter(filterCondition);
                }
              }}
              searchOptions={searchOptions}
            />
          </div>
        }
      />
      <Route
        path="/edit/:emailTemplateId"
        element={<EmailTemplateInfo onCancel={handleCancel} />}
      />
      <Route
        path="/add"
        element={<EmailTemplateInfo onCancel={handleCancel} />}
      />
    </Routes>
  );
};

export default EmailTemplateList;
