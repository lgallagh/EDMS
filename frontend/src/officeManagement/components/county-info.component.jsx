import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Added useLocation
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule, AsyncRule } from "devextreme-react/form";
import ResizableTextArea from "../../shared/components/resizable-text-area.component";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { validateVanityURL } from "../../shared/services/validate-vanity-url.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/select-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";



const CountyInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const navigate = useNavigate();
  const { countyId } = useParams();
  const [stateList, setStateList] = useState([]);

  // Debugging

  const [countyData, setCountyData] = useState({
    id: "",
    display_name: "",
    vanity_url: "",
    state: "",
    seo_title :"",
    seo_description:"",
    seo_keywords: ""
  });

  const [originalCountyData, setOriginalCountyData] = useState(null);

  //  Ensure application & privilege are strings (not arrays)
  useEffect(() => {
    console.log("countyId:"+countyId)

      const fetchCountyData = async () => {
      if (countyId) {
        try {
          const response = await axiosService.postData(`/officemanagement/county/getCounty`, { countyId });
          setCountyData(response.data);
          setOriginalCountyData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching county data:", error);
          setFailureMessage("Error fetching county data. Please try again.");
        }

      }
    
  };
  const fetchLists = async () => {
    try {
      const response = await axiosService.getData("/lists/stateList");
      const filteredStates = response.data.filter(state => state.display_in_cms === "Y");
      setStateList(filteredStates);
    } catch (error) {
      console.error("Error fetching lists:", error);
      setFailureMessage("Failed to load states list.");
    }
  };
  fetchLists();
  fetchCountyData();
}, [countyId]);


  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();


    try {
     
      if (countyData.id) {
        const response = await axiosService.postData("/officeManagement/county/update", { countyData, originalCountyData });
        if (response.data) {
          setSuccessMessage("County information successfully updated.");
          navigate("/office-management/county-list", { replace: true })
        }
      } else {
        const response = await axiosService.postData("/officeManagement/county/add", { countyData, originalCountyData });
        if (response.data) {
          setSuccessMessage("County successfully added.");
          const newUserId = response.data.id;
          navigate(`/office-management/county-list`, { replace: true });
        }
      }
    } catch (error) {
      console.error("Error updating County information:", error);
      setFailureMessage("Failed to update County information. Please try again.");
    }
  },[countyData, navigate]);

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
      <p className="cont_heading">County Info</p>
      <form onSubmit={handleSubmit} className="form-container">
        <Form formData={countyData}  colCount={1} labelMode="outside" showValidationSummary={true}>
          
          {/* Group 1 */}
          <GroupItem >
            <SimpleItem dataField="display_name" label={{ text: "Display Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="County is required." />
            </SimpleItem>
            <SimpleItem dataField="vanity_url" label={{ text: "Vanity Url" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Vanity Url is required." />
              <AsyncRule
                validationCallback={(params) => validateVanityURL(params, "counties", countyData.id)}
                message="Vanity URL must be unique."
              />
            </SimpleItem>
            <SimpleItem
              dataField="state"
              label={{ text: "State" }} 
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: stateList,
                displayExpr: "state_name",
                valueExpr: "state_code",
                placeholder: "Select a State",
                searchEnabled: true,
              }}
            />
            <SimpleItem dataField="seo_title" label={{ text: "SEO Title" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="SEO Title is required." />
            </SimpleItem>
            <SimpleItem
              dataField="seo_description"
              label={{ text: "SEO Description" }}
              render={(data) => renderResizableTextArea(data, "seo_description")}
            />
            <SimpleItem dataField="seo_keywords" label={{ text: "SEO Keywords" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="SEO Keywords is required." />
            </SimpleItem>

          </GroupItem>





          {/* Submit and Cancel Buttons */}
          <GroupItem colCount={2} colSpan={2} itemType="group" cssClass="button-group">
            <ButtonItem buttonOptions={{ text: "Submit", type: "default", useSubmitBehavior: true }} />
            <ButtonItem buttonOptions={{ text: "Cancel", type: "default", onClick: onCancel }} />
          </GroupItem>
        </Form>
      </form>
    </div>
  );
};

export default CountyInfo;
