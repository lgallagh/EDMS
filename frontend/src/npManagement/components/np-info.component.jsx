import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule, AsyncRule } from "devextreme-react/form";
import DataSource from "devextreme/data/data_source";
import ResizableTextArea from "../../shared/components/resizable-text-area.component";
import HtmlEditorComponent from "../../shared/components/html-editor.component";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { validateVanityURL } from "../../shared/services/validate-vanity-url.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/tag-box";
import "devextreme-react/select-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";

const NPInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [npData, setNPData] = useState({
    id: "",
    selectedOffices: [],
    doctor_first_name: "",
    doctor_middle_name: "",
    doctor_last_name: "",
    doctor_credential: "",
    doctor_short_name: "",
    CAQHID: "",
    extended_shot_hours: "",
    healthgrades_url: "",
    doctor_youtube_channel_url: "",
    doctor_facebook_url: "",
    doctor_twitter_url: "",
    doctor_instagram_url: "",
    doctor_google_url: "",
    doctor_linkedin_url: "",
    speciality: "",
    email: "",
    phone: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    vanity_url: "",
    selectedLanguages: [],
    NPI: "",
    review_code_top: "",
    review_code_bottom: "",
    gender: "",
    is_active: "",
    is_virtual_visit: "",
    is_submit_to_nextgen_active: "",
    biography: "",
    biography_spanish: "",
    right_column_text: "",
    image_file: "",
  });

  const [originalNPData, setOriginalNPData] = useState(null);

  const [officeList, setOfficeList] = useState([]);
  const [languageList, setLanguageList] = useState([]);
  const [tempImageFile, setTempImageFile] = useState(null);

  useEffect(() => {
    const fetchNPData = async () => {
      if (doctorId) {
        try {
          const response = await axiosService.postData(`/npManagement/nps/load`, { doctorId });
          setNPData(response.data);
          setOriginalNPData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching NP data:", error);
          setFailureMessage("Error fetching NP data. Please try again.");
        }
      }
    };

    const fetchLists = async () => {
      try {
        const offices = await axiosService.getData("/lists/officeList");
        const languages = await axiosService.getData("/lists/languageList");
        setOfficeList(offices.data);
        setLanguageList(languages.data);
      } catch (error) {
        console.error("Error fetching lists:", error);
        setFailureMessage("Error fetching list data. Please try again.");
      }
    };

    fetchLists();
    fetchNPData();
  }, [doctorId]);

  const handleFileChange = (e) => {
    setTempImageFile(e.target.files[0]);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Append npData as a JSON string
      formData.append("npData", JSON.stringify(npData));

      //Append the original data before any updates
      formData.append("originalNPData", JSON.stringify(originalNPData));

      // Append image file if selected
      if (tempImageFile) {
        formData.append("file", tempImageFile);
      }

      // Send data to the server
      const endpoint = npData.id ? "/npManagement/nps/update" : "/npManagement/nps/add";
      const response = await axiosService.postDataUpload(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data) {
        setSuccessMessage(npData.id ? "NP information successfully updated." : "NP successfully added.");

        navigate(`/np-management/details`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating NP information:", error);
      setFailureMessage("Failed to update NP information. Please try again.");
    }
  }, [npData, navigate, tempImageFile]);

  const renderResizableTextArea = useCallback((data, field) => (
    <ResizableTextArea
      id={data.editorOptions.inputAttr.id}
      value={data.component.option("formData")[field]}
      onValueChanged={(newValue) => data.component.updateData(field, newValue)}
      initialHeight={90}
    />
  ), []);

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">NP Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form 
            formData={npData} 
            colCount={2} 
            labelMode="outside"
            showValidationSummary={true}>

          <GroupItem colCount={1}>
            <SimpleItem
              dataField="selectedOffices"
              label={{ text: "Office Visited" }} 
              editorType="dxTagBox"
              editorOptions={{
                dataSource: new DataSource({
                  store: officeList,
                  group: "county_name",
                  sort: ["county_name", "office_name"], // Optional: Sort by county_name and then by office_name
                }),
                displayExpr: "office_name", 
                valueExpr: "id", 
                placeholder: "Select offices",
                showSelectionControls: true,
                searchEnabled: true,
                multiline: true,
                grouped: true
              }}
            />
            <SimpleItem dataField="doctor_first_name" label={{ text: "First Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="First Name is required." />
            </SimpleItem>
            <SimpleItem dataField="doctor_middle_name" label={{ text: "Middle Name" }} editorType="dxTextBox" />
            <SimpleItem dataField="doctor_last_name" label={{ text: "Last Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Last Name is required." />
            </SimpleItem>
            <SimpleItem dataField="doctor_credential" label={{ text: "Credential" }} editorType="dxTextBox">
              <RequiredRule message="Credentials are required." />
            </SimpleItem>
            <SimpleItem dataField="doctor_short_name"label={{ text: "Professional Short Name" }}  editorType="dxTextBox">
              <RequiredRule message="Professional Short Name is required." />
            </SimpleItem>
            <SimpleItem dataField="doctor_youtube_channel_url" label={{ text: "Youtube Channel URL" }} editorType="dxTextBox" />
            <SimpleItem dataField="doctor_facebook_url" label={{ text: "Facebook URL" }} editorType="dxTextBox" />
            <SimpleItem dataField="doctor_twitter_url"label={{ text: "Twitter URL" }}  editorType="dxTextBox" />
            <SimpleItem dataField="doctor_instagram_url" label={{ text: "Instagram URL" }} editorType="dxTextBox" />
            <SimpleItem dataField="doctor_google_url" label={{ text: "Google+ URL" }} editorType="dxTextBox" />
            <SimpleItem dataField="doctor_linkedin_url" label={{ text: "LinkedIn URL" }} editorType="dxTextBox" />
          </GroupItem>

          {/* Group 2 */}
          <GroupItem colCount={1}>
            <SimpleItem
              dataField="speciality"
              editorType="dxSelectBox"
              editorOptions={{ items: ["ENT", "Allergy", "COSM"], placeholder: "Select Specialty" }}
              >
              <RequiredRule message="Specialty is required." />
            </SimpleItem>
            <SimpleItem dataField="email" editorType="dxTextBox" />
            <SimpleItem dataField="phone" editorType="dxTextBox" />
            <SimpleItem dataField="seo_title" label={{ text: "SEO Title" }} editorType="dxTextBox" />
            <SimpleItem dataField="seo_description" label={{ text: "SEO Description" }} editorType="dxTextBox" />
            <SimpleItem dataField="seo_keywords"label={{ text: "SEO Keyword" }} editorType="dxTextBox" />
            <SimpleItem dataField="vanity_url" label={{ text: "Vanity URL" }} editorType="dxTextBox">
             <RequiredRule message="Vanity URL is required." />
             <AsyncRule
                validationCallback={(params) => validateVanityURL(params, "doctors", npData.id)}
                message="Vanity URL must be unique."
              />
            </SimpleItem>
            <SimpleItem
              dataField="selectedLanguages"
              label={{ text: "Language Spoken" }} 
              editorType="dxTagBox"
              editorOptions={{
                dataSource: languageList,
                displayExpr: "language",
                valueExpr: "id",
                placeholder: "Select languages",
                showSelectionControls: true,
                searchEnabled: true,
                multiline: true,
              }}
              >
              <RequiredRule message="Language Spoken is required." />
            </SimpleItem>
            <SimpleItem dataField="NPI" editorType="dxTextBox">
             <RequiredRule message="NPI is required." />
            </SimpleItem>
            
            <SimpleItem
              dataField="review_code_top"
              label={{ text: "Review Code on Top" }}
              render={(data) => renderResizableTextArea(data, "review_code_top")}
            />
            <SimpleItem
              dataField="review_code_bottom"
              label={{ text: "Review Code on Bottom" }}
              render={(data) => renderResizableTextArea(data, "review_code_bottom")}
            />
            <SimpleItem
                dataField="gender"
                editorType="dxRadioGroup"
                label={{ text: "Gender" }}
                editorOptions={{
                    items: [
                    { text: "Male", value: "M" },
                    { text: "Female", value: "F" },
                    ],
                    valueExpr: "value", 
                    displayExpr: "text", 
                    layout: "horizontal",
                }}
                >
             <RequiredRule message="Gender is required." />
            </SimpleItem>

                <SimpleItem
                dataField="is_active"
                editorType="dxSelectBox"
                label={{ text: "Is Active" }}
                editorOptions={{
                    dataSource: [
                    { value: "Y", text: "Active" },
                    { value: "N", text: "Non-active" },
                    { value: "P", text: "Pending-active" },
                    ],
                    valueExpr: "value",
                    displayExpr: "text",
                    placeholder: "Select Status",
                }}
                >
                <RequiredRule message="Is Active is required." />
              </SimpleItem>

                <SimpleItem
                dataField="is_virtual_visit"
                editorType="dxRadioGroup"
                label={{ text: "Virtual Visits" }}
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
                <RequiredRule message="Virtual Visits is required." />
              </SimpleItem>

                <SimpleItem
                dataField="is_submit_to_nextgen_active"
                editorType="dxRadioGroup"
                label={{ text: 'Is "Submit Direct To Nextgen" Enabled in QuickApp?', cssClass: "dx-label" }}
                editorOptions={{
                    items: [
                    { text: "Yes", value: "Y" },
                    { text: "No", value: "N" },
                    ],
                    valueExpr: "value",
                    displayExpr: "text",
                    layout: "horizontal",
                }}
                />
          </GroupItem>

          <GroupItem colCount={1} colSpan={2}>
            <SimpleItem
              dataField="biography"
              label={{ text: "Biography" }}
              render={(data) => (
                <HtmlEditorComponent
                  value={data.component.option("formData").biography}
                  onValueChanged={(newValue) => data.component.updateData("biography", newValue)}
                  uploadURL="/htmlEditor/uploadProvider"
                />
              )}
            />
            <SimpleItem
              dataField="biography_spanish"
              label={{ text: "Biography in Spanish" }}
              render={(data) => (
                <HtmlEditorComponent
                  value={data.component.option("formData").biography_spanish}
                  onValueChanged={(newValue) => data.component.updateData("biography_spanish", newValue)}
                  uploadURL="/htmlEditor/uploadProvider"
                />
              )}
            />
            <SimpleItem
              dataField="right_column_text"
              label={{ text: "Additional Right Column Text" }}
              render={(data) => (
                <HtmlEditorComponent
                  value={data.component.option("formData").right_column_text}
                  onValueChanged={(newValue) => data.component.updateData("right_column_text", newValue)}
                  uploadURL="/htmlEditor/uploadProvider"
                />
              )}
            />
          </GroupItem>

          <GroupItem colCount={1} colSpan={2}>
            <div className="input text">
              <label htmlFor="image_upload">Upload Image (176px*254px)</label>
              <input type="file" id="image_upload" name="temp_image_file" onChange={handleFileChange} />
            </div>
            {npData.image_file && (
              <div className="image-preview">
                <label htmlFor="image_file">&nbsp;</label>
                <img src={import.meta.env.VITE_REACT_APP_BASE_URL + '/' + npData.image_file} width="176" height="254" id="image_file" alt="Image File" />
              </div>
            )}
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

export default NPInfo;
