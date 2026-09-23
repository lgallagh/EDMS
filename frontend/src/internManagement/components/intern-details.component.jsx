import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule } from "devextreme-react/form";
import DataSource from "devextreme/data/data_source";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/tag-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";

const InternDetails = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [internData, setInternData] = useState({
    id: "",
    type: "",
    selectedPrimaryOffices: [],
    selectedSecondaryOffices: [],
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    is_active: ""
  });

  const [originalInternData, setOriginalInternData] = useState(null);

  const [primaryOfficeList, setPrimaryOfficeList] = useState([]);
  const [secondaryOfficeList, setSecondaryOfficeList] = useState([]);
  const [tempImageFile, setTempImageFile] = useState(null);

  
  //Track selected office IDs for the purpose of disabling them in the other selects
  const [selectedPrimaryOfficeIds, setSelectedPrimaryOfficeIds] = useState([]);
  const [selectedSecondaryOfficeIds, setSelectedSecondaryOfficeIds] = useState([]);
  
  useEffect(() => {
    const fetchInternData = async () => {
      if (professionalId) {
        try {
          const response = await axiosService.postData(`/internManagement/interns/loadIntern`, { professionalId: professionalId });
          setInternData(response.data);
          setOriginalInternData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching intern data:", error);
          setFailureMEssage("Error fetching intern data. Please try again.");

        }
      }
    };

    const fetchLists = async () => {
      try {
        const offices = await axiosService.getData("/lists/officeList");
        
        setPrimaryOfficeList(offices.data);
        setSecondaryOfficeList(offices.data);
      } catch (error) {
        console.error("Error fetching lists:", error);
        setFailureMEssage("Error fetching list data. Please try again.");
      }
    };

    fetchLists();
    fetchInternData();
  }, [professionalId]);

//We need to update which offices should be disabled before the user starts working with them, but after all the data is loaded
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    // Ensure this logic runs only once, on initial load
    if (
      isInitialLoad &&
      internData &&
      internData.selectedPrimaryOffices &&
      internData.selectedSecondaryOffices &&
      primaryOfficeList.length > 0 &&
      secondaryOfficeList.length > 0
    ) {
      // Calculate initial disabled states
  
      // Primary Office disables IDs from Secondary Offices
      const primaryDisableIds = [
        ...internData.selectedPrimaryOffices
      ];
      setSelectedPrimaryOfficeIds(primaryDisableIds);
      updateDisabledStates("selectedPrimaryOffices", primaryDisableIds);
  
      // Secondary Office disables IDs from Primary Offices
      const secondaryDisableIds = [
        ...internData.selectedSecondaryOffices
      ];
      setSelectedSecondaryOfficeIds(secondaryDisableIds);
      updateDisabledStates("selectedSecondaryOffices", secondaryDisableIds);
  
      setIsInitialLoad(false); // Mark initial load as complete
    }
  }, [internData, primaryOfficeList, secondaryOfficeList]);

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

      // Append internData as a JSON string
      formData.append("internData", JSON.stringify(internData));

      //Append the original data before any updates
      formData.append("originalInternData", JSON.stringify(originalInternData));

      // Append image file if selected
      if (tempImageFile) {
        formData.append("file", tempImageFile);
      }

      // Send data to the server
      const endpoint = internData.id ? "/internManagement/interns/update" : "/internManagement/interns/add";
      const response = await axiosService.postDataUpload(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data) {
        setSuccessMessage(internData.id ? "Intern information successfully updated." : "Intern successfully added.");

        navigate(`/intern-management/details`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating intern information:", error);
      setFailureMEssage("Failed to update intern information. Please try again.");
    }
  }, [internData, navigate, tempImageFile]);

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">Intern Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form 
            formData={internData} 
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
            <SimpleItem dataField="first_name" label={{ text: "Intern First Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="First Name is required." />
            </SimpleItem>
            <SimpleItem dataField="middle_name" label={{ text: "Intern Middle Name" }} editorType="dxTextBox" />
            <SimpleItem dataField="last_name" label={{ text: "Intern Last Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Last Name is required." />
            </SimpleItem>
          </GroupItem>

          {/* Group 2 */}
          <GroupItem colCount={1}>
            <SimpleItem dataField="email" editorType="dxTextBox" />
            <SimpleItem dataField="phone" editorType="dxTextBox" />
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

export default InternDetails;
