import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule } from "devextreme-react/form";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";

const HospitalInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const [hospitalData, setHospitalData] = useState({
    id: "",
    hospital_name: "",
    is_active: ""
  });

  const [originalHospitalData, setOriginalHospitalData] = useState(null);

  
  useEffect(() => {
    const fetchHospitalData = async () => {
      if (hospitalId) {
        try {
          const response = await axiosService.postData(`/hospitalAffiliation/hospitals/load`, { hospitalId });
          setHospitalData(response.data);
          setOriginalHospitalData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching hospital data:", error);
          setFailureMessage("Error fetching hospital data. Please try again.");
        }
      }
    };

    fetchHospitalData();
  }, [hospitalId]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {

      // Send data to the server
      const endpoint = hospitalData.id ? "/hospitalAffiliation/hospitals/update" : "/hospitalAffiliation/hospitals/add";
      const response = await axiosService.postData(endpoint, {hospitalData, originalHospitalData});

      if (response.data) {
        setSuccessMessage(hospitalData.id ? "Hospital information successfully updated." : "Hospital successfully added.");

        navigate(`/hospital-affiliation/hospital-list`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating hospital information:", error);
      setFailureMessage("Failed to update hospital information. Please try again.");
    }
  }, [hospitalData, navigate]);

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">Hospital Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form 
            formData={hospitalData} 
            colCount={2} 
            labelMode="outside"
            showValidationSummary={true}>

          <GroupItem colCount={1} colSpan={2}>
            <SimpleItem dataField="hospital_name" label={{ text: "Hospital Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Hospital Name is required." />
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

export default HospitalInfo;
