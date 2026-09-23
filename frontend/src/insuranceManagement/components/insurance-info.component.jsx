import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule } from "devextreme-react/form";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";
import TextBoxList from "../../shared/components/text-box-list.component";
import "../../shared/styles/insurance-info.css"; 

const InsuranceInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { insuranceId } = useParams();
  const navigate = useNavigate();
  
  const [insuranceData, setInsuranceData] = useState({
    id: "",
    insurance_name: "",
    states: "",
    plans: "",
    selectedInsuranceCodes: "",
    selectedPlans:""
  });

  const [originalInsuranceData, setOriginalInsuranceData] = useState(null);

  const [stateList, setStateList] = useState([]);
  const [loading, setLoading] = useState(false); // State to handle loading state

  useEffect(() => {
    const fetchInsuranceData = async () => {
      if (insuranceId) {
        try {
          const response = await axiosService.postData("/insuranceManagement/insurances/loadInsurance", { insuranceId });
          const responseData = response.data;
          setInsuranceData(responseData);
          setOriginalInsuranceData(JSON.parse(JSON.stringify(response.data)));
          
        } catch (error) {
          console.error("Error fetching insurance data:", error);
          setFailureMessage("Failed to load insurance data.");
        }
      }
    };
    const fetchLists = async () => {
      try {
        const states = await axiosService.getData("/lists/stateList");
        setStateList(states.data);
      } catch (error) {
        console.error("Error fetching lists:", error);
        setFailureMessage("Failed to load states list.");
      }
    };
    fetchLists();
    fetchInsuranceData();
  }, [insuranceId]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading when submitting
    try {
      console.log(`Insurance Data to Persist: ${JSON.stringify(insuranceData)}`)
      const endpoint = insuranceData.id ? "/insuranceManagement/insurances/update" : "/insuranceManagement/insurances/add";
      const response = await axiosService.postData(endpoint, {insuranceData, originalInsuranceData});
      if (response.data) {
        setSuccessMessage(insuranceData.id ? "Insurance information successfully updated." : "Insurance successfully added.");
       
        navigate(`/insurance-management/insurance-list`, { replace: true });
          //setInsuranceData({ id: "", insurance_name: "", states: [], plans: [] }); // Reset form data
        
      }
    } catch (error) {
      console.error("Error updating insurance information:", error);
      setFailureMessage("Failed to update insurance information. Please try again.");
    } finally {
      setLoading(false); // Stop loading once request is completed
    }
  }, [insuranceData, navigate]);

const renderTextBoxList = useCallback((data, field) => {
  const plans = Array.isArray(insuranceData.selectedPlans) ? insuranceData.selectedPlans : [];  // Ensure it's an array
  //console.log('Plans data:', plans);  // Log the plans data to check if it's correctly formatted
  
  // Filter out undefined or null plans and ensure they have the plan_name property
  const validPlans = plans.filter(plan => plan && plan.plan_name);

  return (
    <TextBoxList
      id={data.editorOptions.inputAttr.id}
      value={validPlans}  // Now safely access plan_name
      label="Insurance Plan:"
      onValueChanged={(newValue) => {
        //const updatedPlans = newValue.map(name => validPlans.find(plan => plan.plan_name === name));
        data.component.updateData(field, newValue);  // Update form data with the selected plans
      }}
    />
  );
}, [insuranceData]); // Re-run if insuranceData changes
  
  

  return (
    <div className="inside_area_ctn btm_gap insurance-info-container">
      <p className="cont_heading">Insurance Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form formData={insuranceData} colCount={1} labelMode="outside" showValidationSummary={true}>
          <GroupItem caption="Insurance Information" colIndex={0} colSpan={1}>
            <SimpleItem
              dataField="insurance_name"
              label={{ text: "Insurance Name" }}
              editorType="dxTextBox"
              isRequired={true}
            >
              <RequiredRule message="Insurance Name is required." />
            </SimpleItem>
            <SimpleItem
              dataField="selectedStateCodes"
              label={{ text: "States" }} 
              editorType="dxTagBox"
              editorOptions={{
                dataSource: stateList,
                displayExpr: "state_name",
                valueExpr: "state_code",
                placeholder: "Select States",
                showSelectionControls: true,
                searchEnabled: true,
                multiline: true,
              }}
            >
              <RequiredRule message="States is required." />
            </SimpleItem>
          </GroupItem>
          <GroupItem>
            <SimpleItem
              dataField="selectedPlans"
              label={{ visible: false }}
              render={(data) => renderTextBoxList(data, "selectedPlans")}
            />
          </GroupItem>
          <GroupItem colCount={2}>
            <ButtonItem 
              buttonOptions={{ 
                text: "Submit", 
                type: "default", 
                useSubmitBehavior: true, 
                disabled: loading 
              }} 
            />
            <ButtonItem buttonOptions={{ text: "Cancel", type: "default", onClick: onCancel }} />
          </GroupItem>
        </Form>
      </form>
    </div>
  );
};

export default InsuranceInfo;
