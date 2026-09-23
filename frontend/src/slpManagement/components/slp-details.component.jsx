import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule, AsyncRule } from "devextreme-react/form";
import DataSource from "devextreme/data/data_source";
import HtmlEditorComponent from "../../shared/components/html-editor.component";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { validateVanityURL } from "../../shared/services/validate-vanity-url.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/tag-box";
import "devextreme-react/select-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";

const SLPDetails = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [slpData, setSLPData] = useState({
    id: "",
    type: "",
    selectedPrimaryOffices: [],
    selectedSecondaryOffices: [],
    first_name: "",
    middle_name: "",
    last_name: "",
    professional_short_name: "",
    maiden_name: "",
    credential: "",
    biography: "",
    email: "",
    phone: "",
    image_file: "",
    vanity_url: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    selectedLanguages: [],
    NPI: "",
    is_active: "",
    display_in_website: "",
    employee_id: "",
    employment_status: ""
  });

  const [originalSLPData, setOriginalSLPData] = useState(null);

  const [primaryOfficeList, setPrimaryOfficeList] = useState([]);
  const [secondaryOfficeList, setSecondaryOfficeList] = useState([]);
  const [languageList, setLanguageList] = useState([]);
  const [tempImageFile, setTempImageFile] = useState(null);

  
  //Track selected office IDs for the purpose of disabling them in the other selects
  const [selectedPrimaryOfficeIds, setSelectedPrimaryOfficeIds] = useState([]);
  const [selectedSecondaryOfficeIds, setSelectedSecondaryOfficeIds] = useState([]);
  
  useEffect(() => {
    const fetchSLPData = async () => {
      if (professionalId) {
        try {
          const response = await axiosService.postData(`/slpManagement/slps/loadSLP`, { professionalId: professionalId });
          setSLPData(response.data);
          setOriginalSLPData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching slp data:", error);
          setFailureMessage("Error fetching SLP data. Please try again.");
        }
      }
    };

    const fetchLists = async () => {
      try {
        const offices = await axiosService.getData("/lists/officeList");
        const languages = await axiosService.getData("/lists/languageList");
        
        setPrimaryOfficeList(offices.data);
        setSecondaryOfficeList(offices.data);
        setLanguageList(languages.data);
      } catch (error) {
        console.error("Error fetching lists:", error);
        setFailureMessage("Error fetching list data. Please try again.");
      }
    };

    fetchLists();
    fetchSLPData();
  }, [professionalId]);

//We need to update which offices should be disabled before the user starts working with them, but after all the data is loaded
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    // Ensure this logic runs only once, on initial load
    if (
      isInitialLoad &&
      slpData &&
      slpData.selectedPrimaryOffices &&
      slpData.selectedSecondaryOffices &&
      primaryOfficeList.length > 0 &&
      secondaryOfficeList.length > 0
    ) {
      // Calculate initial disabled states
  
      // Primary Office disables IDs from Secondary Offices
      const primaryDisableIds = [
        ...slpData.selectedPrimaryOffices
      ];
      setSelectedPrimaryOfficeIds(primaryDisableIds);
      updateDisabledStates("selectedPrimaryOffices", primaryDisableIds);
  
      // Secondary Office disables IDs from Primary Offices
      const secondaryDisableIds = [
        ...slpData.selectedSecondaryOffices
      ];
      setSelectedSecondaryOfficeIds(secondaryDisableIds);
      updateDisabledStates("selectedSecondaryOffices", secondaryDisableIds);
  
      setIsInitialLoad(false); // Mark initial load as complete
    }
  }, [slpData, primaryOfficeList, secondaryOfficeList]);

  //Update the list of selected IDs held in state for an office list
  const updateDisabledStates = (key, selectedIds) => {
    if(key == "selectedPrimaryOffices") {
        setSelectedPrimaryOfficeIds(selectedIds);
    }
    if(key == "selectedSecondaryOffices") {
        setSelectedSecondaryOfficeIds(selectedIds);
    }
  };

  //Toggle IDs in office lists to disable/enable them
  const updateDisableList = (list, idsToDisable) =>
    list.map((item) => ({
        ...item,
        disabled: idsToDisable.includes(item.id),
  }));

  //When one of the lists of selected offices is changed, update disabled selections
  useEffect(() => {
    let primaryDisableIds = [
        ...selectedSecondaryOfficeIds
        ];
    setPrimaryOfficeList((prev) => updateDisableList(prev, primaryDisableIds));

    let secondaryDisableIds = [
        ...selectedPrimaryOfficeIds
        ];
    setSecondaryOfficeList((prev) => updateDisableList(prev, secondaryDisableIds));
    
  }, [selectedPrimaryOfficeIds, selectedSecondaryOfficeIds]);

  //Event to trigger off of TagBox actually changing
  const handleOfficeChange = (e, key) => {
    // Update the disabled states for the other lists
    //The event may take a different form on initial page load
    if(e.constructor === Array) {
      updateDisabledStates(key, e);
    }
    else if(e.value?.constructor === Array) {
      updateDisabledStates(key, e.value);
    }
  };

  const handleFileChange = (e) => {
    setTempImageFile(e.target.files[0]);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Append slpData as a JSON string
      formData.append("slpData", JSON.stringify(slpData));

      //Append the original data before any updates
      formData.append("originalSLPData", JSON.stringify(originalSLPData));

      // Append image file if selected
      if (tempImageFile) {
        formData.append("file", tempImageFile);
      }

      // Send data to the server
      const endpoint = slpData.id ? "/slpManagement/slps/update" : "/slpManagement/slps/add";
      const response = await axiosService.postDataUpload(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data) {
        setSuccessMessage(slpData.id ? "SLP information successfully updated." : "SLP successfully added.");

        navigate(`/slp-management/details`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating slp information:", error);
      setFailureMessage("Failed to update slp information. Please try again.");
    }
  }, [slpData, navigate, tempImageFile]);

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">SLP Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form 
            formData={slpData} 
            colCount={2} 
            labelMode="outside"
            showValidationSummary={true}>

          <GroupItem colCount={1}>
            <SimpleItem
              dataField="selectedPrimaryOffices"
              label={{ text: "Primary Office" }} 
              editorType="dxTagBox"
              editorOptions={{
                dataSource: new DataSource({
                  store: primaryOfficeList,
                  group: "county_name",
                  sort: ["county_name", "office_name"],
                }),
                displayExpr: "office_name", 
                valueExpr: "id", 
                placeholder: "Select offices",
                showSelectionControls: true,
                searchEnabled: true,
                multiline: true,
                grouped: true,
                onValueChanged: (e) => handleOfficeChange(e, "selectedPrimaryOffices")
              }}
            />
            <SimpleItem
              dataField="selectedSecondaryOffices"
              label={{ text: "Secondary Office" }} 
              editorType="dxTagBox"
              editorOptions={{
                dataSource: new DataSource({
                  store: secondaryOfficeList,
                  group: "county_name",
                  sort: ["county_name", "office_name"],
                }),
                displayExpr: "office_name", 
                valueExpr: "id", 
                placeholder: "Select offices",
                showSelectionControls: true,
                searchEnabled: true,
                multiline: true,
                grouped: true,
                onValueChanged: (e) => handleOfficeChange(e.value, "selectedSecondaryOffices")
              }}
            />
            <SimpleItem dataField="first_name" label={{ text: "SLP First Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="First Name is required." />
            </SimpleItem>
            <SimpleItem dataField="middle_name" label={{ text: "SLP Middle Name" }} editorType="dxTextBox" />
            <SimpleItem dataField="last_name" label={{ text: "SLP Last Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Last Name is required." />
            </SimpleItem>
            <SimpleItem dataField="credential" label={{ text: "SLP Credential" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Credentials are required." />
            </SimpleItem>
            <SimpleItem dataField="NPI" editorType="dxTextBox" isRequired>
             <RequiredRule message="NPI is required." />
            </SimpleItem>
          </GroupItem>

          {/* Group 2 */}
          <GroupItem colCount={1}>
            <SimpleItem dataField="email" editorType="dxTextBox" />
            <SimpleItem dataField="phone" editorType="dxTextBox" />
            <SimpleItem dataField="seo_title" label={{ text: "SEO Title" }} editorType="dxTextBox" />
            <SimpleItem dataField="seo_description" label={{ text: "SEO Description" }} editorType="dxTextBox" />
            <SimpleItem dataField="seo_keywords"label={{ text: "SEO Keyword" }} editorType="dxTextBox" />
            <SimpleItem dataField="vanity_url" label={{ text: "Vanity URL" }} editorType="dxTextBox" isRequired>
             <RequiredRule message="Vanity URL is required." />
             <AsyncRule
                validationCallback={(params) => validateVanityURL(params, "professionals", slpData.id)}
                message="Vanity URL must be unique."
              />
            </SimpleItem>
            <SimpleItem
              dataField="selectedLanguages"
              label={{ text: "Language Spoken" }} 
              editorType="dxTagBox"
              isRequired
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
          </GroupItem>

          <GroupItem colCount={1} colSpan={2}>
            <SimpleItem
              dataField="biography"
              label={{ text: "Biography" }}
              render={(data) => (
                <HtmlEditorComponent
                  value={data.component.option("formData").biography}
                  onValueChanged={(newValue) => data.component.updateData("biography", newValue)}
                  uploadURL="/htmlEditor/uploadSlp"
                />
              )}
            />
          </GroupItem>

          <GroupItem colCount={1} colSpan={2}>
            <div className="input text">
              <label htmlFor="image_upload">Upload Image (176px*254px)</label>
              <input type="file" id="image_upload" name="temp_image_file" onChange={handleFileChange} />
            </div>
            {slpData.image_file && (
              <div className="image-preview">
                <label htmlFor="image_file">&nbsp;</label>
                <img src={import.meta.env.VITE_REACT_APP_BASE_URL + '/' + slpData.image_file} width="176" height="254" id="image_file" alt="Image File" />
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

export default SLPDetails;
