import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Added useLocation
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule } from "devextreme-react/form";
import { CheckBox } from "devextreme-react/check-box";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/select-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";
import AdminOptions from "../../shared/data/adminData"


const AdminUserInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const navigate = useNavigate();
  const { adminUserId } = useParams();
  const [showPasswordField, setShowPasswordField] = useState(false); 

  // Debugging

  const [adminUserData, setAdminUserData] = useState({
    id: "",
    username: "",
    password: "",
    section: "",
    privilege: "" 
  });

  const [originalAdminUserData, setOriginalAdminUserData] = useState(null);

  //  Ensure application & privilege are strings (not arrays)
  useEffect(() => {
    console.log("adminUserId:"+adminUserId)

      const fetchAdminUserData = async () => {
      if (adminUserId) {
        try {
          const response = await axiosService.postData(`/adminUtilities/adminUsers/getAdminUser`, { adminUserId });
          setAdminUserData(response.data);
          setOriginalAdminUserData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching user data:", error);
          setFailureMessage("Error fetching user data. Please try again.");
        }

      }
    
  };
  fetchAdminUserData();
}, [adminUserId]);


  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();


    try {
     
      if (adminUserData.id) {
        const response = await axiosService.postData("/adminUtilities/adminUsers/update", { adminUserData, originalAdminUserData });
        if (response.status == 200) {
          setSuccessMessage("Admin User information successfully updated.");
          navigate("/admin-utilities/manage-admin", { replace: true })
        }
      } else {
        const response = await axiosService.postData("/adminUtilities/adminUsers/add", { adminUserData });
        if (response.status == 200) {
          setSuccessMessage("Admin User successfully added.");
          const newUserId = response.data.id;
          navigate(`/admin-utilities/manage-admin/`, { replace: true });
        }
      }
    } catch (error) {
      console.error("Error updating Admin User information:", error);
      setFailureMessage("Failed to update Admin User information. Please try again.");
    }
  },[adminUserData, navigate]);

  return (
    <div className="inside_area_ctn btm_gap">
      <p className="cont_heading">Backend Login Info</p>
      <form onSubmit={handleSubmit} className="form-container">
        <Form formData={adminUserData}  labelMode="outside" showValidationSummary={true}>
          
          {/* Group 1 */}
          <GroupItem >
            <SimpleItem dataField="username" label={{ text: "Username" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Username is required." />
            </SimpleItem>

            {/* Add Checkbox to Show/Hide Password */}
            {adminUserId != null ? (
            <SimpleItem>
            
              <div style={{ display: "flex", alignItems: "center" }}>
                <label style={{ marginRight: "10px", minWidth: "150px", textAlign: "right" }}>
                  Click To Change Password:
                </label>
                
                  <CheckBox
                    value={showPasswordField}
                    onValueChanged={(e) => {
                      setShowPasswordField(e.value);
                      if (!e.value) {
                        setAdminUserData((prev) => ({ ...prev, password: "" })); // Clear password if unchecked
                      }
                    }}
                  />
                
              </div>
             
            </SimpleItem>
             ) : null}

            {/* Conditionally Show Password Field */}
            {(showPasswordField || adminUserId == null) && (
              <SimpleItem dataField="password" label={{ text: "Password" }} editorType="dxTextBox" isRequired>
                <RequiredRule message="Password is required." />
              </SimpleItem>
            )}


            <SimpleItem
              dataField="section"
              label={{ text: "Application" }}
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: AdminOptions.applicationOptions,
                displayExpr: "name",
                valueExpr: "id",
                placeholder: "Select an Application",
                searchEnabled: true
              }}
            />

            <SimpleItem
              dataField="privilege"
              label={{ text: "Privilege" }}
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: AdminOptions.privilegeOptions,
                displayExpr: "name",
                valueExpr: "id",
                placeholder: "Select a Privilege",
                searchEnabled: true
              }}
            />
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

export default AdminUserInfo;
