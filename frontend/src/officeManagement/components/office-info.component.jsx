import React, { useState, useEffect, useCallback, useMemo ,useRef} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule, AsyncRule } from "devextreme-react/form";
import ResizableTextArea from "../../shared/components/resizable-text-area.component";
import MaskedInput from "../../shared/components/masked-input.component";
import DaySchedule from "../../shared/components/day-schedule.component";
import FileUploader from "devextreme-react/file-uploader";
import { validateVanityURL } from "../../shared/services/validate-vanity-url.service";
import { useResultContext } from "../../shared/context/result.context";


import AxiosCalls from "../../shared/services/axios-calls.service";

//import "../../assets/css/office-info.css"; 

const OfficeInfo = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { officeId } = useParams();
  const navigate = useNavigate();

  const statusOptions = [
    { id: "Y", name: "Yes" },
    { id: "N", name: "No" }
  ];
  const activeOptions = [
    { id: "Y", name: "Active" },
    { id: "N", name: "Non-active" },
    { id: "P", name: "Pending-active"}
  ];
  
  const [officeData, setOfficeData] = useState({
    id: "",
    office_name: "",
    office_iso: "",
    google_street_location: "",
    google_street_location2: "",
    gps_street_location: "",
    street_location: "",
    street_location2: "",
    city: "",
    county_id: "",
    state: "",
    zip: "",
    phone: "",
    fax: "",
    backline_phone: "",
    pixcel_code_fb: "",
    administrator: "",
    psa_email: "",
    psa_emergency_contact: "",
    patient_information: "",
    regional_manager: "",
    google_map_url: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    vanity_url: "",
    nextgen_id: "",
    financing_url: "",
    review_code_bottom: "",
    microdata_code_seo: "",
    lat: "",
    lon: "",
    cc_go_live: "",
    document_title: "",
    document_file: "",
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    is_sleep: "",
    is_latenight: "",
    is_active: "",
    is_submit_to_nextgen_active: "",
  });

  const [originalOfficeData, setOriginalOfficeData] = useState(null);

  const [countyList, setCountyList] = useState([]);
  const [formKey, setFormKey] = useState(0);


  useEffect(() => {
    const fetchOfficeData = async () => {
      if (officeId) {
        try {
          const response = await axiosService.postData("/officeManagement/offices/loadOffice", { officeId });
          setOfficeData(response.data);
          setOriginalOfficeData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching office data:", error);
          setFailureMessage("Error fetching office data. Please try again.");
        }
      }
    };
    const fetchLists = async () => {
      try {
        const counties = await axiosService.getData("/lists/countyList");
        setCountyList(counties.data);
      } catch (error) {
        console.error("Error fetching lists:", error);
        setFailureMessage("Error fetching list data. Please try again.");
      }
    };
    fetchLists();
    fetchOfficeData();

  }, [officeId]);

  useEffect(() => {
    console.log("Updated officeData:", officeData);
    setFormKey((prev) => prev + 1);
  }, [officeData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      const officeDataJSON = JSON.stringify(officeData);
      console.log(`Office Data Json: ${officeDataJSON}`)
      formData.append("officeData", officeDataJSON);

      //Append the original data before any updates
      formData.append("originalOfficeData", JSON.stringify(originalOfficeData));
   

      // Get file from the FileUploader component
      const fileInput = document.querySelector("input[type='file']");
      if (fileInput && fileInput.files.length > 0) {
          formData.append("file", fileInput.files[0]); // Append file to FormData
      }

      const endpoint = officeData.id ? "/officeManagement/offices/update" : "/officeManagement/offices/add";
      const response = await axiosService.postData(endpoint, formData,  {
            headers: {
                "Content-Type": "multipart/form-data"
            }
          });
      if (response.data) {
        setSuccessMessage(officeData.id ? "Office information successfully updated." : "Office successfully added.");
       
          navigate(`/office-management/office-list`, { replace: true });
        }
      
    } catch (error) {
      console.error("Error updating office information:", error);
      setFailureMessage("Failed to update office information. Please try again.");
    }
  }, [officeData, navigate]);

  const validateTimeInput = (value) => {
    const timeRegex = /^(0[1-9]|1[0-2]):([0-5][0-9])\s?(am|pm)\s?-\s?(0[1-9]|1[0-2]):([0-5][0-9])\s?(am|pm)$/i;
    return timeRegex.test(value.trim());
  };


  const renderResizableTextArea = useCallback((data, field) => (
    <ResizableTextArea
      id={data.editorOptions.inputAttr.id}
      value={data.component.option("formData")[field]}
      onValueChanged={(newValue) => data.component.updateData(field, newValue)}
      initialHeight={90}
    />
  ), []);
  // Render callback for the masked input.
  const renderMaskedInput = useCallback((data, field) => (
    <MaskedInput
      id={data.editorOptions.inputAttr.id}
      value={data.component.option("formData")[field]}
      onValueChanged={(newValue) => data.component.updateData(field, newValue)}
      mask="(000) 000-0000"
    />
  ), []);


    // Render callback for the time-range masked input.
    const renderTimeRange = useCallback((data, field) => (
        <DaySchedule id={ data.editorOptions.inputAttr.id}
            initialValue={ data.component.option("formData")[field]}
            onChange={(newValue) => data.component.updateData(field, newValue)}
        />
    ), []);


  

  return (
    <div className="inside_area_ctn btm_gap office-info-container">
      <p className="cont_heading">Office Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form key={formKey} formData={officeData} colCount={2} labelMode="outside" showValidationSummary={true}>
        <GroupItem colCount={1}>
        <GroupItem  colIndex={0} colSpan={1} >
          <SimpleItem
            dataField="office_name"
            label={{ text: "Office Name" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Office Name is required." />
          </SimpleItem>
          <SimpleItem
            dataField="office_iso"
            label={{ text: "Office Code" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Office Code is required." />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Office Address (for Google Map display)" colIndex={0} colSpan={1} cssClass="fieldset-border">
          <SimpleItem
            dataField="google_street_location"
            label={{ text: "Street Location" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Google Street Location is required." />
          </SimpleItem>
          <SimpleItem
            dataField="google_street_location2"
            label={{ text: "Street Location 2" }}
            editorType="dxTextBox"
          />
        </GroupItem>

        <GroupItem caption="Office Address for GPS" colIndex={0} colSpan={1} cssClass="fieldset-border">
          <SimpleItem
            dataField="gps_street_location"
            label={{ text: "Street Location" }}
            editorType="dxTextBox"
          />
        </GroupItem>

        <GroupItem caption="Postal Address" colIndex={0} colSpan={1} cssClass="fieldset-border">
          <SimpleItem
            dataField="street_location"
            label={{ text: "Street Location" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Postal Street Location is required." />
          </SimpleItem>
          <SimpleItem
            dataField="street_location2"
            label={{ text: "Street Location2" }}
            editorType="dxTextBox"
          />
        </GroupItem>

        <GroupItem caption="Google Map URL" colIndex={0} colSpan={1} cssClass="fieldset-border">
          <SimpleItem
            dataField="google_map_url"
            label={{ text: "Google Map URL" }}
            editorType="dxTextBox"
          />
        </GroupItem>

        <GroupItem colIndex={0} colSpan={1}>
          <SimpleItem
            dataField="city"
            label={{ text: "City" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="City is required." />
          </SimpleItem>
          <SimpleItem
            dataField="county_id"
            label={{ text: "County" }}
            editorType="dxSelectBox"
            isRequired={true}
            editorOptions={{
              dataSource: countyList,
              displayExpr: "display_name",
              valueExpr: "id",
              placeholder: "Select County"
            }}
          >
            <RequiredRule message="County is required." />
          </SimpleItem>
          <SimpleItem
            dataField="zip"
            label={{ text: "Zip" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Zip is required." />
          </SimpleItem>
        </GroupItem>

          <GroupItem  colIndex={0} colSpan={1}>
            <SimpleItem dataField="phone" label={{ text: "Phone" }} editorType="dxTextBox" 
              render = {
                  (data) => renderMaskedInput(data, "phone")
              } />

            <SimpleItem dataField="fax" label={{ text: "Fax" }} editorType="dxTextBox" 
              render = {
                (data) => renderMaskedInput(data, "fax")
              } />

            <SimpleItem dataField="backline_phone" label={{ text: "Back Line Phone" }} editorType="dxTextBox" 
              render = {
              (data) => renderMaskedInput(data, "backline_phone")
              } />


          </GroupItem>
          <GroupItem  colIndex={0} colSpan={1}>
          <SimpleItem
            dataField="vanity_url"
            label={{ text: "Vanity Url" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Vanity Url is required." />
            <AsyncRule
                validationCallback={(params) => validateVanityURL(params, "offices", officeData.id)}
                message="Vanity URL must be unique."
              />
          </SimpleItem>
          <SimpleItem
            dataField="cc_go_live"
            label={{ text: "Callcenter go live date" }}
            editorType="dxDateBox"
            editorOptions={{ 
              displayFormat: "yyyy-MM-dd", 
              useMaskBehavior: true,
              placeholder: "Select a date"
            }}
          />

          <SimpleItem
            dataField="nextgen_id"
            label={{ text: "Nextgen Office Id" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Nextgen Office Id is required." />
          </SimpleItem>
        </GroupItem>

     <GroupItem  colIndex={0} colSpan={1}>
          <SimpleItem
            dataField="patient_information"
            label={{ text: "Patient Information" }}
            render={(data) => renderResizableTextArea(data, "patient_information")}
          />
          <SimpleItem
            dataField="financing_url"
            label={{ text: "Wells Fargo URL" }}
            editorType="dxTextBox"
          />
          <SimpleItem
            dataField="pixcel_code_fb"
            label={{ text: "Pixcel Code for FB Ad" }}
            render={(data) => renderResizableTextArea(data, "pixcel_code_fb")}
          />
          <SimpleItem
            dataField="review_code_bottom"
            label={{ text: "Schema Markup Code" }}
            render={(data) => renderResizableTextArea(data, "review_code_bottom")}
          />
          <SimpleItem
            dataField="microdata_code_seo"
            label={{ text: "Microdata SEO Code" }}
            render={(data) => renderResizableTextArea(data, "microdata_code_seo")}
          />
        </GroupItem> 
    </GroupItem>
  {/* Right Column:  */}
    <GroupItem colCount={1}>
          <GroupItem  colCount={1}>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => (
              <SimpleItem
                key={day}
                dataField={day}
                label={{ text: day.charAt(0).toUpperCase() + day.slice(1) }}
                render = {
                    (data) => renderTimeRange(data, day)
                }
            
              />
            ))}
          < SimpleItem
          key = "saturday"
          dataField = "saturday"
          label = {{ text: "Saturday" }}editorType = "dxTextBox"
          />

          </GroupItem>

          <GroupItem colIndex={1} colSpan={1}>
          <SimpleItem
            dataField="lat"
            label={{ text: "Latitude" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Latitude is required." />
          </SimpleItem>
          <SimpleItem
            dataField="lon"
            label={{ text: "Longitude" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="Longitude is required." />
          </SimpleItem>
        </GroupItem>

        <GroupItem  colIndex={1} colSpan={1}>
          <SimpleItem
            dataField="psa_email"
            label={{ text: "PSA email" }}
            editorType="dxTextBox"
          />
          <SimpleItem
            dataField="psa_emergency_contact"
            label={{ text: "PSA emergency contact (mobile)" }}
            editorType="dxTextBox"
          />
          <SimpleItem
            dataField="administrator"
            label={{ text: "Site Administrator" }}
            editorType="dxTextBox"
          />
          <SimpleItem
            dataField="regional_manager"
            label={{ text: "Regional Manager" }}
            editorType="dxTextBox"
          />
        </GroupItem>

        <GroupItem colIndex={1} colSpan={1}>
          <SimpleItem
            dataField="is_sleep"
            label={{ text: "Is Sleep Center" }}
            editorType="dxRadioGroup"
            editorOptions={{
              dataSource: statusOptions,
              displayExpr: "name",
              valueExpr: "id",
              layout: "horizontal"
            }}
          />
          <SimpleItem
            dataField="is_latenight"
            label={{ text: "Offers Late Night" }}
            editorType="dxRadioGroup"
            editorOptions={{
              dataSource: statusOptions,
              displayExpr: "name",
              valueExpr: "id",
              layout: "horizontal"
            }}
          />
         
          <SimpleItem
              dataField="is_active"
              label={{ text: "Is Active" }}
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: activeOptions,
                displayExpr: "name",
                valueExpr: "id",
                layout: "horizontal"
              }}
            />
          <SimpleItem
            dataField="is_submit_to_nextgen_active"
            label={{ text: "Is 'Submit Direct To Nextgen' Enabled in QuickApp?" }}
            editorType="dxRadioGroup"
            editorOptions={{
              dataSource: statusOptions,
              displayExpr: "name",
              valueExpr: "id",
              layout: "horizontal"
            }}
          />
        </GroupItem>

        <GroupItem  colIndex={1} colSpan={1}>
          <SimpleItem
            dataField="seo_title"
            label={{ text: "SEO Title" }}
            editorType="dxTextBox"
            isRequired={true}
          >
            <RequiredRule message="SEO Title is required." />
          </SimpleItem>
          <SimpleItem
            dataField="seo_description"
            label={{ text: "SEO Description" }}
            render={(data) => renderResizableTextArea(data, "seo_description")}
          />
          <SimpleItem
            dataField="seo_keywords"
            label={{ text: "SEO Keywords" }}
            editorType="dxTextBox"
          />
        </GroupItem>

        <GroupItem colIndex={1} colSpan={1}>
          <SimpleItem
            dataField="document_file"
            label={{ text: "Additional Document" }}
            editorType="dxFileUploader"
            editorOptions={{
              selectButtonText: "Select File",
              labelText: "No file selected",
              uploadMode: "useButton"
            }}
          />
          <SimpleItem
            dataField="document_title"
            label={{ text: "Additional Document title" }}
            editorType="dxTextBox"
          />
        </GroupItem>
        </GroupItem>
          
          
          <GroupItem colSpan={1} horizontalAlignment="left">
            <GroupItem colCount={2}>
              <ButtonItem buttonOptions={{ text: "Submit", type: "default", useSubmitBehavior: true }} />
              <ButtonItem buttonOptions={{ text: "Cancel", type: "default", onClick: onCancel }} />
            </GroupItem>
          </GroupItem>
         
        </Form>
      </form>
    </div>
  );
};

export default OfficeInfo;
