import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem } from "devextreme-react/form";
import HTMLEditorComponent from "../../shared/components/html-editor.component";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";

const DoctorServiceAltText = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { doctorOfficeId } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [doctorOfficeData, setDoctorOfficeData] = useState({
    id: "",
    doctor_first_name: "",
    doctor_middle_name: "",
    doctor_last_name: "",
    doctor_credential: "",
    office_name: "",
    service_alternate_text: "",
    service_alternate_text_hidden: ""
  });
  const [originalDoctorOfficeData, setOriginalDoctorOfficeData] = useState(null);

  useEffect(() => {
    const fetchDoctorOfficeData = async () => {
      if (doctorOfficeId) {
        try {
          const response = await axiosService.postData(
            `/doctorManagement/doctor-service-alt-text/load`,
            { doctorOfficeId }
          );
          const data = response.data;
          setOriginalDoctorOfficeData(JSON.parse(JSON.stringify(data)));
          // Synchronize hidden input for validation
          data.service_alternate_text_hidden = data.service_alternate_text;
          setDoctorOfficeData(data);
        } catch (error) {
          console.error("Error fetching doctor service alt text data:", error);
          setFailureMessage("Error fetching doctor service alternate text. Please try again.");
        }
      }
    };
    fetchDoctorOfficeData();
  }, [doctorOfficeId, axiosService]);

  const handleSubmit = useCallback(async () => {
    const formInstance = formRef.current.instance();
    const validationResult = formInstance.validate();
    if (validationResult.isValid) {
      try {
        const response = await axiosService.postData(
          "doctorManagement/doctor-service-alt-text/update",
          { doctorOfficeData, originalDoctorOfficeData }
        );
        if (response.data) {
          setSuccessMessage("Doctor Service Alt Text information successfully updated.");
          navigate(`/doctor-management/doctor-service-alt-text`, { replace: true });
        }
      } catch (error) {
        console.error("Error updating doctor service alt text:", error);
        setFailureMessage("Failed to update doctor service alt text. Please try again.");
      }
    }
  }, [doctorOfficeData, axiosService]);

  return (
    <>
      {/* Inline CSS to hide the hidden dxTextBox without using display: none */}
      <div className="inside_area_ctn btm_gap">
        <p className="cont_heading">Doctor Alternate Text</p>
        <div className="required_fields">* marked are mandatory.</div>
        <form onSubmit={handleSubmit} className="form-container">
          <Form
            ref={formRef}
            formData={doctorOfficeData}
            colCount={2}
            labelMode="outside"
            showValidationSummary={true}
            validationGroup="doctorServiceAltTextForm"
          >
            <GroupItem colCount={1} colSpan={2}>
              <SimpleItem
                dataField="doctor_first_name"
                label={{ text: "Doctor" }}
                template={(data, container) => {
                  const span = document.createElement("span");
                  span.textContent = data.editorOptions.value;
                  container.appendChild(span);
                }}
              />
              <SimpleItem
                dataField="office_name"
                label={{ text: "Office" }}
                template={(data, container) => {
                  const span = document.createElement("span");
                  span.textContent = data.editorOptions.value;
                  container.appendChild(span);
                }}
              />
            </GroupItem>
            <GroupItem colCount={1} colSpan={2}>
              {/* Visible custom editor */}
              <SimpleItem
                dataField="service_alternate_text"
                label={{ text: "Service Alternate Text" }}
                isRequired={true}
                render={(data) => (
                  <HTMLEditorComponent
                    value={data.component.option("formData").service_alternate_text}
                    onValueChanged={(newValue) => {
                      // Update both fields so that the hidden widget stays in sync.
                      data.component.updateData("service_alternate_text", newValue);
                      data.component.updateData("service_alternate_text_hidden", newValue);
                    }}
                    uploadURL="/htmlEditor/uploadDoctor"
                  />
                )}
              />
              {/* Hidden dxTextBox for validation */}
              <SimpleItem
                dataField="service_alternate_text_hidden"
                editorType="dxTextBox"
                cssClass="htmleditor-validator"
                validationRules={[
                  {
                    type: "custom",
                    validationCallback: (e) => e.value?.length <= 1000,
                    message: "Service Alternate Text should not exceed 1000 characters."
                  }
                ]}
              />
            </GroupItem>
            <GroupItem colCount={2}>
              <ButtonItem
                buttonOptions={{
                  text: "Submit",
                  type: "default",
                  useSubmitBehavior: false,
                  onClick: () => {
                    const formValidation = formRef.current.instance().validate();
                    if (formValidation.isValid) {
                      handleSubmit();
                    }
                  }
                }}
              />
              <ButtonItem
                buttonOptions={{
                  text: "Cancel",
                  type: "default",
                  onClick: onCancel
                }}
              />
            </GroupItem>
          </Form>
        </form>
      </div>
    </>
  );
};

export default DoctorServiceAltText;
