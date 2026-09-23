import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule } from "devextreme-react/form";
import HtmlEditorComponent from "../../shared/components/html-editor.component";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/select-box";
import "devextreme-react/radio-group";

const EmailTemplateInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { emailTemplateId } = useParams();
  const navigate = useNavigate();
  const [emailTemplateData, setEmailTemplateData] = useState({
      id: "",
      title: "",
      to_person: "",
      from_person: "",
      cc: "",
      subject_line: "",
      body_text: "",
      create_date: "",
      is_active: "",
      email_type: ""
  });

  const [originalEmailTemplateData, setOriginalEmailTemplateData] = useState(null);

  useEffect(() => {
    const fetchEmailTemplateData = async () => {
      if (emailTemplateId) {
        try {
          const response = await axiosService.postData(`/manageEmailTemplates/emailTemplates/load`, { emailTemplateId });
          setEmailTemplateData(response.data);
          setOriginalEmailTemplateData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching email template data:", error);
          setFailureMessage("Error fetching email template data. Please try again.");
        }
      }
    };

    fetchEmailTemplateData();
  }, [emailTemplateId]);


  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      // Send data to the server
      const endpoint = emailTemplateData.id ? "/manageEmailTemplates/emailTemplates/update" : "/manageEmailTemplates/emailTemplates/add";
      const response = await axiosService.postData(endpoint, { emailTemplateData, originalEmailTemplateData });

      if (response.data) {
        setSuccessMessage(emailTemplateData.id ? "Email Template information successfully updated." : "Email Template successfully added.");

        navigate(`/manage-email-templates/cms-email-template-list`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating Email Template information:", error);
      setFailureMessage("Failed to update Email Template information. Please try again.");
    }
  }, [emailTemplateData, navigate]);

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">Email Template Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form 
            formData={emailTemplateData} 
            colCount={2} 
            labelMode="outside"
            showValidationSummary={true}>

          <GroupItem colCount={1} colSpan={2}>
            <SimpleItem dataField="title" label={{ text: "Title" }} editorType="dxTextBox" editorOptions={{ placeholder: "Title"}} isRequired>
              <RequiredRule message="Title is required." />
            </SimpleItem>
            <SimpleItem dataField="subject_line" label={{ text: "Subject" }} editorType="dxTextBox" editorOptions={{ placeholder: "Enter Subject Line"}} isRequired>
              <RequiredRule message="Subject is required." />
            </SimpleItem>
            <SimpleItem
              dataField="body_text"
              label={{ text: "Body Text" }}
              render={(data) => (
                <HtmlEditorComponent
                  value={data.component.option("formData").body_text}
                  onValueChanged={(newValue) => data.component.updateData("body_text", newValue)}
                  uploadURL="/htmlEditor/uploadCMS"
                />
              )}
            />
            <SimpleItem
                dataField="email_type"
                editorType="dxSelectBox"
                label={{ text: "Email Type" }}
                editorOptions={{
                    dataSource: [
                    { value: "appointment", text: "Appointment" },
                    { value: "allergy_shot", text: "Allergy Shot" },
                    { value: "hearing_aid", text: "Hearing Aid" },
                    { value: "appt_cancel", text: "Appointment Cancellation" },
                    { value: "allergy_shot_cancel", text: "Allergy Shot Cancellation" },
                    { value: "hearing_aid_cancel", text: "Hearing Aid Cancellation" },
                    { value: "reschedule", text: "Reschedule" }
                    ],
                    valueExpr: "value",
                    displayExpr: "text",
                    placeholder: "Select Status",
                }}
                >
                <RequiredRule message="Email Type is required." />
              </SimpleItem>
              <SimpleItem dataField="to_person" label={{ text: "To" }} editorType="dxTextBox" editorOptions={{ placeholder: "To Person"}} />
              <SimpleItem dataField="from_person" label={{ text: "From Person" }} editorType="dxTextBox" editorOptions={{ placeholder: "From Person"}} isRequired>
                <RequiredRule message="From Person is required." />
              </SimpleItem>
              <SimpleItem dataField="cc" label={{ text: "CC" }} editorType="dxTextBox" editorOptions={{ placeholder: "CC"}}/>
              <SimpleItem
                dataField="is_active"
                editorType="dxRadioGroup"
                label={{ text: "Is Active" }}
                editorOptions={{
                    items: [
                    { text: "Yes", value: "Y" },
                    { text: "No", value: "N" },
                    ],
                    valueExpr: "value", 
                    displayExpr: "text", 
                    layout: "horizontal",
                }}
                >
             <RequiredRule message="Is Active is required." />
            </SimpleItem>
          </GroupItem>

         
          {/* Submit and Cancel Buttons */}
          <GroupItem colCount={2}>
            <ButtonItem buttonOptions={{ text: "Submit", type: "default", useSubmitBehavior: true }} />
            <ButtonItem buttonOptions={{ text: "Cancel", type: "default", onClick: onCancel }} />
          </GroupItem>
        </Form>
      </form>
    </div>
  );
};

export default EmailTemplateInfo;
