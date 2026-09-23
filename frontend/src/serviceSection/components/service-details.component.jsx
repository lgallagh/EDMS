import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule, AsyncRule } from "devextreme-react/form";
import HtmlEditorComponent from "../../shared/components/html-editor.component";
import ResizableTextArea from "../../shared/components/resizable-text-area.component";
import AxiosCalls from "../../shared/services/axios-calls.service";
import { validateVanityURL } from "../../shared/services/validate-vanity-url.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/tag-box";
import "devextreme-react/select-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";

const ServiceDetails = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [serviceData, setServiceData] = useState({
    id: "",
    selectedDoctors: [],
    service_name: "",
    image_file: "",
    vanity_url: "",
    sort_order: "",
    icon_name: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    blurb: "",
    content: "",
    is_active: ""
  });
  const [originalServiceData, setOriginalServiceData] = useState(null);

  const [doctorList, setDoctorList] = useState([]);
  const menuFileRef = useRef(null);
  const listFileRef = useRef(null);
  const bannerFileRef = useRef(null);

  
  useEffect(() => {
    const fetchServiceData = async () => {
      if (serviceId) {
        try {
          const response = await axiosService.postData(`/serviceSection/services/loadService`, { serviceId: serviceId });
          setServiceData(response.data);
          setOriginalServiceData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching service data:", error);
          setFailureMessage("Error fetching service data. Please try again.");
        }
      }
    };

    const fetchLists = async () => {
      try {
        const doctors = await axiosService.getData("/lists/doctorList");
       
        setDoctorList(doctors.data);
      } catch (error) {
        console.error("Error fetching lists:", error);
        setFailureMessage("Error fetching list data. Please try again.");
      }
    };

    fetchLists();
    fetchServiceData();
  }, [serviceId]);


  const handleMenuFileChange = (e) => {
    menuFileRef.current = e.target.files[0];
  };

  const handleListFileChange = (e) => {
    listFileRef.current = e.target.files[0];
  };

  const handleBannerFileChange = (e) => {
    bannerFileRef.current = e.target.files[0];
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Append serviceData as a JSON string
      formData.append("serviceData", JSON.stringify(serviceData));

      //Append the original data before any updates
      formData.append("originalServiceData", JSON.stringify(originalServiceData));

      // Append image files if selected
      if (menuFileRef.current) {
        formData.append("menu_image_file", menuFileRef.current);
      }
      if (listFileRef.current) {
        formData.append("list_image_file", listFileRef.current);
      }
      if (bannerFileRef.current) {
        formData.append("banner_image_file", bannerFileRef.current);
      }

      // Send data to the server
      const endpoint = serviceData.id ? "/serviceSection/services/update" : "/serviceSection/services/add";
      const response = await axiosService.postDataUpload(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data) {
        setSuccessMessage(serviceData.id ? "Service information successfully updated." : "Service successfully added.");

        navigate(`/service-section/service-list`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating service information:", error);
      setFailureMessage("Failed to update service information. Please try again.");
    }
  }, [serviceData, navigate]);

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
      <p className="cont_heading">Service Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form 
            formData={serviceData} 
            colCount={2} 
            labelMode="outside"
            showValidationSummary={true}>

          <GroupItem colCount={1}>
          <SimpleItem
              dataField="selectedDoctors"
              label={{ text: "Doctor Names" }} 
              editorType="dxTagBox"
              editorOptions={{
                dataSource: doctorList,
                displayExpr: (doctor) => {
                  if (!doctor) return "";
                  return `${doctor.doctor_first_name} ${
                    doctor.doctor_middle_name ? doctor.doctor_middle_name + " " : ""
                  }${doctor.doctor_last_name}, ${doctor.doctor_credential}`;
                },
                valueExpr: "id",
                placeholder: "Select doctors",
                showSelectionControls: true,
                searchEnabled: true,
                multiline: true
              }}
              />
            <SimpleItem dataField="service_name" label={{ text: "Service Name" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Service Name is required." />
            </SimpleItem>
            <SimpleItem dataField="vanity_url" label={{ text: "Vanity URL" }} editorType="dxTextBox" isRequired>
             <RequiredRule message="Vanity URL is required." />
             <AsyncRule
                validationCallback={(params) => validateVanityURL(params, "services", serviceData.id)}
                message="Vanity URL must be unique."
              />
            </SimpleItem>
            <SimpleItem>
              <div className="input text">
                <label htmlFor="menu_image_upload">Upload Menu Image (50px*50px)</label>
                <input
                  type="file"
                  id="menu_image_upload"
                  name="temp_menu_image_file"
                  onChange={handleMenuFileChange}
                />
              </div>
            </SimpleItem>
            <SimpleItem>
              <div className="input text">
                <label htmlFor="list_image_upload">Upload List Image (475px*220px)</label>
                <input type="file" id="list_image_upload" name="temp_list_image_file" onChange={handleListFileChange} />
              </div>
            </SimpleItem>
            <SimpleItem>
              <div className="input text">
                <label htmlFor="banner_image_upload">Upload Banner Image (1200px*292px)</label>
                <input type="file" id="banner_image_upload" name="temp_banner_image_file" onChange={handleBannerFileChange} />
              </div>
            </SimpleItem>
          </GroupItem>

          {/* Group 2 */}
          <GroupItem colCount={1}>
            <SimpleItem dataField="seo_title" label={{ text: "SEO Title" }} editorType="dxTextBox">
              <RequiredRule message="SEO Title is required." />
            </SimpleItem>
            <SimpleItem dataField="seo_description" label={{ text: "SEO Description" }} editorType="dxTextBox">
              <RequiredRule message="SEO Description is required." />
            </SimpleItem>
            <SimpleItem dataField="seo_keywords"label={{ text: "SEO Keywords" }} editorType="dxTextBox">
              <RequiredRule message="SEO Keywords is required." />
            </SimpleItem>
            <SimpleItem dataField="sort_order" label={{ text: "Sort Order" }} 
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,   
                min: 0,                  
                step: 1,
                format: {                
                  type: "fixedPoint",
                  precision: 0
                }
              }}>
              <RequiredRule message="Sort Order is required." />
            </SimpleItem>
            <SimpleItem
                dataField="is_active"
                editorType="dxRadioGroup"
                label={{ text: "Is Active" }}
                editorOptions={{
                    items: [
                    { text: "Yes", value: "Y" },
                    { text: "No", value: "N" },
                    ],
                    valueExpr: "value", 
                    displayExpr: "text", 
                    layout: "horizontal",
                }}
                >
             <RequiredRule message="Is Active is required." />
            </SimpleItem>
          </GroupItem>

          <GroupItem colCount={1} colSpan={2}>
            {serviceData.menu_image && (
              <div className="image-preview">
                <label htmlFor="menu_image">&nbsp;</label>
                <img src={import.meta.env.VITE_REACT_APP_BASE_URL + '/' + serviceData.menu_image} width="50" height="50" id="menu_image" alt="Menu Image" />
              </div>
            )}
          </GroupItem>
          <GroupItem colCount={1} colSpan={2}>
            {serviceData.list_image && (
              <div className="image-preview">
                <label htmlFor="list_image">&nbsp;</label>
                <img src={import.meta.env.VITE_REACT_APP_BASE_URL + '/' + serviceData.list_image} width="475" height="220" id="list_image" alt="List Image" />
              </div>
            )}
          </GroupItem>
          <GroupItem colCount={1} colSpan={2}>
            {serviceData.banner_image && (
              <div className="image-preview">
                <label htmlFor="banner_image">&nbsp;</label>
                <img src={import.meta.env.VITE_REACT_APP_BASE_URL + '/' + serviceData.banner_image} width="1200" height="292" id="banner_image" alt="Banner Image" />
              </div>
            )}
          </GroupItem>
          
          <GroupItem colCount={1}>
            <SimpleItem dataField="icon_name" label={{ text: "Icon Name" }} editorType="dxTextBox" />
            <SimpleItem template={(data, container) => {
              const span = document.createElement('span');
              span.textContent = "(This field is for technical use.)";
              container.appendChild(span);
            }} />
          </GroupItem>
          <GroupItem colCount={1}>
          </GroupItem>

          <GroupItem colCount={1}>
          <SimpleItem
              dataField="blurb"
              label={{ text: "Blurb" }}
              render={(data) => renderResizableTextArea(data, "blurb")}
            />
          </GroupItem>

          <GroupItem colCount={1}>
          </GroupItem>

          <GroupItem colCount={1} colSpan={2}>
            <SimpleItem
              dataField="content"
              label={{ text: "Content" }}
              render={(data) => (
                <HtmlEditorComponent
                  value={data.component.option("formData").content}
                  onValueChanged={(newValue) => data.component.updateData("content", newValue)}
                  uploadURL="/htmlEditor/uploadService"
                />
              )}
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

export default ServiceDetails;
