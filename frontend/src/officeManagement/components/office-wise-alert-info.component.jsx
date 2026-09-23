import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem } from "devextreme-react/form";
import ResizableTextArea from "../../shared/components/resizable-text-area.component";
import DateSelectInput from "../../shared/components/date-select-input.component";
import HtmlEditorComponent from "../../shared/components/html-editor.component";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/select-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";

const OfficeWiseAlertInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const navigate = useNavigate();
  const { officeWiseAlertId } = useParams();

  const statusOptions = [
    { id: "A", name: "Yes" },
    { id: "I", name: "No" }
  ];

  // Initialize dates as Date objects.
  const [officeWiseAlertData, setOfficeWiseAlertData] = useState({
    id: "",
    office_id: "",
    office_name: "",
    message: "",
    start_time:"",  // "YYYY-MM-DD"
    end_time: "",
    status: "",
    modified: "",
    created: ""
  });

  const [originalOfficeWiseAlertData, setOriginalOfficeWiseAlertData] = useState(null);

  const [officeList, setOfficeList] = useState([]);

  // Helper to compute year options.
  const getYearOptions = (fieldDate) => {
    const baseDate = fieldDate
      ? fieldDate instanceof Date
        ? fieldDate
        : new Date(fieldDate)
      : new Date();
    const baseYear = baseDate.getFullYear();
    const currentYear = new Date().getFullYear();
    const minYear = Math.min(currentYear - 5, baseYear);
    const maxYear = currentYear + 5;
    const yearOptions = [];
    for (let y = minYear; y <= maxYear; y++) {
      yearOptions.push(y);
    }
    return yearOptions;
  };

  useEffect(() => {
    const fetchOfficeWiseAlertData = async () => {
      if (officeWiseAlertId) {
        try {
          const response = await axiosService.postData(
            `/officemanagement/officeWiseAlert/getOfficeWiseAlert`,
            { officeWiseAlertId }
          );
          const data = response.data;
          // Convert date fields to string "YYYY-MM-DD" if needed.
          data.start_time = data.start_time ? new Date(data.start_time).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
          data.end_time = data.end_time ? new Date(data.end_time).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
          setOfficeWiseAlertData(data);
          setOriginalOfficeWiseAlertData(JSON.parse(JSON.stringify(data)));
          console.log("Fetched data:", data);
        } catch (error) {
          console.error("Error fetching data:", error);
          setFailureMessage("Error fetching alert data. Please try again.");
        }
      }
    };

    const fetchLists = async () => {
      try {
        const offices = await axiosService.getData("/lists/officeList");
        setOfficeList(offices.data);
      } catch (error) {
        console.error("Error fetching office list:", error);
        setFailureMessage("Error fetching list data. Please try again.");
      }
    };

    fetchLists();
    fetchOfficeWiseAlertData();
  }, [officeWiseAlertId, axiosService]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (officeWiseAlertData.id) {
          const response = await axiosService.postData("/officeManagement/officeWiseAlert/update", { officeWiseAlertData, originalOfficeWiseAlertData });
          if (response.data) {
            setSuccessMessage("OfficeWiseAlert information successfully updated.");
            navigate("/office-management/office-wise-alert", { replace: true });
          }
        } else {
          const response = await axiosService.postData("/officeManagement/officeWiseAlert/add", { officeWiseAlertData });
          if (response.data) {
            setSuccessMessage("OfficeWiseAlert successfully added.");
            const newUserId = response.data.id;
            navigate(`/office-management/office-wise-alert/${newUserId}`, { replace: true });
          }
        }
      } catch (error) {
        console.error("Error updating OfficeWiseAlert information:", error);
        setFailureMessage("Failed to update OfficeWiseAlert information. Please try again.");
      }
    },
    [officeWiseAlertData, axiosService, navigate]
  );

  const renderResizableTextArea = useCallback((data, field) => (
    <ResizableTextArea
      id={data.editorOptions.inputAttr.id}
      value={data.component.option("formData")[field]}
      onValueChanged={(newValue) => data.component.updateData(field, newValue)}
      initialHeight={90}
    />
  ), []);

  // Custom renderer for our date selector.
  const renderDateSelector = useCallback(
    (data, field) => {
      const fieldDate = data.component.option("formData")[field];
      const yearOptions = getYearOptions(fieldDate);
      return (
        <DateSelectInput
          id={data.editorOptions.inputAttr.id}
          date={fieldDate}
          onDateChange={(newDate) => data.component.updateData(field, newDate)}
          label={data.editorOptions.label.text}
          yearOptions={yearOptions}
        />
      );
    },
    []
  );

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">OfficeWiseAlert Info</p>
      <form onSubmit={handleSubmit} className="form-container">
        <Form
          formData={officeWiseAlertData}
          onFieldDataChanged={(e) => setOfficeWiseAlertData(e.component.option("formData"))}
          colCount={1}
          labelMode="outside"
          showValidationSummary={true}
        >
          <GroupItem>
            <SimpleItem
              dataField="office_id"
              label={{ text: "Office List" }}
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: officeList,
                displayExpr: "office_name",
                valueExpr: "id",
                placeholder: "Select an Office",
                searchEnabled: true
              }}
            />
            <SimpleItem
              dataField="start_time"
              label={{ text: "Start Date & Time" }}
              render={(data) => renderDateSelector(data, "start_time")}
            />
            <SimpleItem
              dataField="end_time"
              label={{ text: "End Date & Time" }}
              render={(data) => renderDateSelector(data, "end_time")}
            />
    
            <SimpleItem
              dataField="status"
              label={{ text: "Is Active" }}
              editorType="dxRadioGroup"
              editorOptions={{
                dataSource: statusOptions,
                displayExpr: "name",
                valueExpr: "id",
                layout: "horizontal"
              }}
            />
            <SimpleItem
              dataField="message"
              label={{ text: "Message" }}
              render={(data) => (
                <HtmlEditorComponent
                  value={data.component.option("formData").message}
                  onValueChanged={(newValue) => data.component.updateData("message", newValue)}
                  uploadURL="/htmlEditor/uploadOffice"
                />
              )}
            />
          </GroupItem>
          <GroupItem colCount={2} colSpan={2} itemType="group" cssClass="button-group">
            <ButtonItem buttonOptions={{ text: "Submit", type: "default", useSubmitBehavior: true }} />
            <ButtonItem buttonOptions={{ text: "Cancel", type: "default", onClick: onCancel }} />
          </GroupItem>
        </Form>
      </form>
    </div>
  );
};

export default OfficeWiseAlertInfo;
