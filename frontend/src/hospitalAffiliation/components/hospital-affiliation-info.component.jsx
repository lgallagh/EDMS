import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule, AsyncRule } from "devextreme-react/form";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/date-box";
import "devextreme-react/select-box";

const HospitalAffiliationInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { hospitalAffiliationId } = useParams();
  const navigate = useNavigate();
  const [hospitalAffiliationData, setHospitalAffiliationData] = useState({
    id: "",
    hospital_id: "",
    doctor_id: "",
    privilege_start_date: "",
    privilege_end_date: "",
    staff_status: ""
  });

  const [originalHospitalAffiliationData, setOriginalHospitalAffiliationData] = useState(null);

  const [doctorList, setDoctorList] = useState([]);
  const [hospitalList, setHospitalList] = useState([]);
  
  useEffect(() => {
    const fetchHospitalAffiliationData = async () => {
      if (hospitalAffiliationId) {
        try {
          const response = await axiosService.postData(`/hospitalAffiliation/hospitalAffiliations/load`, { hospitalAffiliationId });
          setHospitalAffiliationData(response.data);
          setOriginalHospitalAffiliationData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching hospital affiliation data:", error);
          setFailureMessage("Error fetching hospital affiliation data. Please try again.");
        }
      }
    };

    const fetchLists = async () => {
        try {
          const doctors = await axiosService.getData("/lists/doctorList");
          const hospitals = await axiosService.getData("/lists/hospitalList");
          setDoctorList(doctors.data);
          setHospitalList(hospitals.data);
        } catch (error) {
          console.error("Error fetching lists:", error);
          setFailureMessage("Error fetching list data. Please try again.");
        }
      };
  
    fetchLists();
    fetchHospitalAffiliationData();
  }, [hospitalAffiliationId]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {

      // Send data to the server
      const endpoint = hospitalAffiliationData.id ? "/hospitalAffiliation/hospitalAffiliations/update" : "/hospitalAffiliation/hospitalAffiliations/add";
      const response = await axiosService.postData(endpoint, {hospitalAffiliationData, originalHospitalAffiliationData });

      if (response.data) {
        setSuccessMessage(hospitalAffiliationData.id ? "Hospital Affiliation information successfully updated." : "Hospital Affiliation successfully added.");

        navigate(`/hospital-affiliation/hospital-affiliation-list`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating hospital affiliation information:", error);
      setFailureMessage("Failed to update hospital affiliation information. Please try again.");
    }
  }, [hospitalAffiliationData, navigate]);

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">Affiliations Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form 
            formData={hospitalAffiliationData} 
            colCount={2} 
            labelMode="outside"
            showValidationSummary={true}>

          <GroupItem colCount={1} colSpan={2}>
          <SimpleItem 
              dataField="hospital_id" 
              label={{ text: "Hospital" }} 
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: hospitalList,
                valueExpr: "id",
                displayExpr: "hospital_name",
                placeholder: "Select a hospital"
              }}
              isRequired
            >
              <RequiredRule message="Hospital is required." />
            </SimpleItem>
            <SimpleItem 
              dataField="doctor_id" 
              label={{ text: "Doctor" }} 
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: doctorList,
                valueExpr: "id",
                displayExpr: (doctor) => {
                    if (!doctor) return "";
                    return `${doctor.doctor_first_name} ${
                      doctor.doctor_middle_name ? doctor.doctor_middle_name + " " : ""
                    }${doctor.doctor_last_name}, ${doctor.doctor_credential}`;
                  },
                placeholder: "Select a doctor"
              }}
              isRequired
            >
              <RequiredRule message="Doctor is required." />
            </SimpleItem>
          <SimpleItem 
              dataField="privilege_start_date" 
              label={{ text: "Privilege Start Date" }} 
              editorType="dxDateBox"
              editorOptions={{
                type: "date",
                displayFormat: "yyyy-MM-dd",
                valueFormat: "yyyy-MM-dd",
                openOnFieldClick: true
              }}
              isRequired
            >
              <RequiredRule message="Privilege Start Date is required." />
            </SimpleItem>
            <SimpleItem 
              dataField="privilege_end_date" 
              label={{ text: "Privilege End Date" }} 
              editorType="dxDateBox"
              editorOptions={{
                type: "date",
                displayFormat: "yyyy-MM-dd",
                valueFormat: "yyyy-MM-dd",
                openOnFieldClick: true
              }}
              isRequired
            >
              <RequiredRule message="Privilege End Date is required." />
            </SimpleItem>
            <SimpleItem dataField="staff_status" label={{ text: "Staff Status" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Staff Status is required." />
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

export default HospitalAffiliationInfo;
