import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate,  } from "react-router-dom"; // Added useLocation
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule, AsyncRule } from "devextreme-react/form";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { validateVanityURL } from "../../shared/services/validate-vanity-url.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/select-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";



const LanguageInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const navigate = useNavigate();
  const { languageId } = useParams();

  // Debugging

  const [languageData, setLanguageData] = useState({
    id: "",
    language: "",
    vanity_url: "",
  });
  
  const [originalLanguageData, setOriginalLanguageData] = useState(null);

  //  Ensure application & privilege are strings (not arrays)
  useEffect(() => {
    console.log("languageId:"+languageId)

      const fetchLanguageData = async () => {
      if (languageId) {
        try {
          const response = await axiosService.postData(`/adminUtilities/language/getLanguage`, { languageId });
          setLanguageData(response.data);
          setOriginalLanguageData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching language data:", error);
          setFailureMessage("Error fetching language data. Please try again.");
        }

      }
    
  };
  fetchLanguageData();
}, [languageId]);


  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();


    try {
     
      if (languageData.id) {
        const response = await axiosService.postData("/adminUtilities/language/update", { languageData, originalLanguageData });
        if (response.data) {
          setSuccessMessage("Language information successfully updated.");
          navigate("/admin-utilities/language-list", { replace: true })
        }
      } else {
        const response = await axiosService.postData("/adminUtilities/language/add", { languageData });
        if (response.data) {
          setSuccessMessage("Language successfully added.");
          const newUserId = response.data.id;
          navigate(`/admin-utilities/language-list`, { replace: true });
        }
      }
    } catch (error) {
      console.error("Error updating Language information:", error);
      setFailureMessage("Failed to update Language information. Please try again.");
    }
  },[languageData, navigate]);

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">Language Info</p>
      <form onSubmit={handleSubmit} className="form-container">
        <Form formData={languageData}  labelMode="outside" showValidationSummary={true}>
          
          {/* Group 1 */}
          <GroupItem >
            <SimpleItem dataField="language" label={{ text: "Language" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Language is required." />
            </SimpleItem>
            <SimpleItem dataField="vanity_url" label={{ text: "Vanity Url" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Vanity Url is required." />
              <AsyncRule
                validationCallback={(params) => validateVanityURL(params, "languages", languageData.id)}
                message="Vanity URL must be unique."
              />
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

export default LanguageInfo;
