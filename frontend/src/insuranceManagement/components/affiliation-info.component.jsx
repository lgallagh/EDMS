import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule } from "devextreme-react/form";

import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";

//import "../../shared/styles/affiliation-info.css"; 

const AffiliationInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { type } = useParams();
  const { affiliationId } = useParams();
  const navigate = useNavigate();
  
  const [affiliationData, setAffiliationData] = useState({
    id: "",
    insurance_id: "",
    insurance_name: "",
    provider_id: "",
    doctor: "",
    provider_number: "",
    office_id: "",
    office_name: "",
    plan_id: "",
    plan_name: "",
    plan_details: "",
    starting_date: "",
    deactivate_date: "",
    type:""
  });

  const [originalAffiliationData, setOriginalAffiliationData] = useState(null);

  const [providerList, setProviderList] = useState([]);
  const [insurancePlanList, setInsuranceList] = useState([]);
  const [officeList, setOfficeList] = useState([]);
  const labelMapping = {
    doctor: "Doctor",
    audiologist: "Audiologist",
    PA: "Physician Assistant"
  };

  useEffect(() => {
    const fetchAffiliationData = async () => {
      if (affiliationId) {
        try {
          console.log(`AffiliationID:${affiliationId}`)
         const response = await axiosService.postData("/insuranceManagement/affiliations/loadAffiliation", { affiliationId, type });
         const responseData = response.data;
        
          setAffiliationData(responseData);
          setOriginalAffiliationData(JSON.parse(JSON.stringify(response.data)));
          console.log(`AffiliationData: ${JSON.stringify(responseData)}`)
        } catch (error) {
          console.error("Error fetching affiliation data:", error);
          setFailureMessage("Error fetching affiliation data. Please try again.");
        }
      }
    };
    const fetchLists = async () => {
      try {
        const provider = await axiosService.getData("/lists/providerList",{params: {"type":type}});
        const insurancePlan = await axiosService.getData("/lists/insurancePlanList");
        const office = await axiosService.getData("/lists/officeList");
    
        let filteredProviderData = provider.data;
        if (type === "doctor") {
          filteredProviderData = provider.data.filter(function(item) {
            return item.type !== "PA";
          });
        } else if (type === "PA") {
          filteredProviderData = provider.data.filter(function(item) {
            return item.type === "PA";
          });
        }
        setProviderList(provider.data);
        setInsuranceList(insurancePlan.data);
        setOfficeList(office.data);
      } catch (error) {
        console.error("Error fetching lists:", error);
        setFailureMessage("Error fetching list data. Please try again.");
      }
    };
    fetchLists();
    fetchAffiliationData();
  }, [affiliationId]);

    // Clear the plan selection when insurance changes
    const handleFieldDataChanged = useCallback((e) => {
      if (e.dataField === "insurance_id") {
        setAffiliationData((prevData) => ({
          ...prevData,
          insurance_id: e.value,
          plan_id: ""
        }));
      } else {
        setAffiliationData((prevData) => ({
          ...prevData,
          [e.dataField]: e.value
        }));
      }
    }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      affiliationData.type = type;
      const endpoint = affiliationData.id ? "/insuranceManagement/affiliations/update" : "/insuranceManagement/affiliations/add";
     console.log(`Affiliation Data to Post ${JSON.stringify(affiliationData)}`);
     
      const response = await axiosService.postData(endpoint, {affiliationData, originalAffiliationData});
      if (response.data) {
        setSuccessMessage(affiliationData.id ? "Affiliation information successfully updated." : "Affiliation successfully added.");
        navigate(`/insurance-management/affiliation/${type}`);
        
      }
    } catch (error) {
      console.error("Error updating affiliation information:", error);
      setFailureMessage("Failed to update affiliation information. Please try again.");
    }
  }, [affiliationData, navigate]);

   // Build a unique list of insurances for the insurance select
   const uniqueInsurances = useMemo(() => {
    const uniqueMap = {};
    insurancePlanList.forEach((item) => {
      if (!uniqueMap[item.insurance_id]) {
        uniqueMap[item.insurance_id] = {
          insurance_id: item.insurance_id,
          insurance_name: item.insurance_name
        };
      }
    });
    return Object.values(uniqueMap);
  }, [insurancePlanList]);

  // Filter plans based on the selected insurance
  const filteredPlans = useMemo(() => {
    return affiliationData.insurance_id
      ? insurancePlanList.filter((item) => item.insurance_id === affiliationData.insurance_id)
      : [];
  }, [affiliationData.insurance_id, insurancePlanList]);

  

  return (
    <div className="inside_area_ctn btm_gap affiliation-info-container">
      <p className="cont_heading">Affiliation Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form formData={affiliationData} colCount={1} labelMode="outside" showValidationSummary={true} onFieldDataChanged={handleFieldDataChanged}>
        <GroupItem caption="Affiliation Information" colIndex={0} colSpan={1}>
          <SimpleItem
                dataField="provider_id"
                label={{ text: `${labelMapping[type]} Name` }}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: providerList,
                  displayExpr: function(item) {
                    // combine name and credential fields 
                    if (type === 'audiologist') {
                      return item ? [item.first_name, item.middle_name, item.last_name, item.credential].filter(function(value) {
                        return value !== undefined && value !== null && value !== "";
                      }).join(" ") : "";
                    }
                    return item ? [item.doctor_first_name, item.doctor_middle_name, item.doctor_last_name, item.doctor_credential].filter(function(value) {
                        return value !== undefined && value !== null && value !== "";
                      }).join(" ") : "";
                  },
                  valueExpr: "id",
                  placeholder: `Select a ${labelMapping[type]}`,
                  searchEnabled: true
                }}
              />
            
            <SimpleItem
                dataField="insurance_id"
                label={{ text: `Insurance Name` }}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: uniqueInsurances,
                  displayExpr: "insurance_name",
                  valueExpr: "insurance_id",
                  placeholder: `Select an Insurance`,
                  searchEnabled: true
                }}
              />

            <SimpleItem
                dataField="office_id"
                label={{ text: `Office Name` }}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: officeList,
                  displayExpr: "office_name",
                  valueExpr: "id",
                  placeholder: `Select an Office`,
                  searchEnabled: true
                }}
              />      

              <SimpleItem
                dataField="plan_id"
                label={{ text: `Plan` }}
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: filteredPlans,
                  displayExpr: "plan_name",
                  valueExpr: "plan_id",
                  placeholder: `Select a Plan`,
                  searchEnabled: true
                }}
              />
            <SimpleItem dataField="provider_number" label={{ text: "Provider Number" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Provider Number is required." />
            </SimpleItem>
            <SimpleItem dataField="plan_details" label={{ text: "Plan Details" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Provider Number is required." />
            </SimpleItem>

            <SimpleItem dataField="starting_date" label={{ text: "Privileges Start Date" }} editorType="dxDateBox" isRequired
            editorOptions={{
              displayFormat: "yyyy-MM-dd",
              dateSerializationFormat: "yyyy-MM-dd",
              useMaskBehavior: true,
              mask: "0000-00-00"
            }}>
              <RequiredRule message="Privileges Start Date is required." />
            </SimpleItem>
            <SimpleItem dataField="deactivate_date" label={{ text: "Privileges End Date" }} editorType="dxDateBox" isRequired
            editorOptions={{
              displayFormat: "yyyy-MM-dd",
              dateSerializationFormat: "yyyy-MM-dd",
              useMaskBehavior: true,
              mask: "0000-00-00"
            }}>
              <RequiredRule message="Privileges End Date is required." />
            </SimpleItem>
            
        

        </GroupItem>
        
          <GroupItem colCount={2}>
            <ButtonItem buttonOptions={{ text: "Submit", type: "default", useSubmitBehavior: true }} />
            <ButtonItem buttonOptions={{ text: "Cancel", type: "default", onClick: onCancel }} />
          </GroupItem>
        </Form>
      </form>
    </div>
  );
};

export default AffiliationInfo;
