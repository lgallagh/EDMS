import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, SimpleItem, GroupItem, ButtonItem, RequiredRule, AsyncRule } from "devextreme-react/form";
import HtmlEditorComponent from "../../shared/components/html-editor.component";
import ResizableTextArea from "../../shared/components/resizable-text-area.component";
import AxiosCalls from "../../shared/services/axios-calls.service";
import  { validateVanityURL } from "../../shared/services/validate-vanity-url.service";
import { useResultContext } from "../../shared/context/result.context";
import "devextreme-react/text-box";
import "devextreme-react/select-box";
import "devextreme-react/text-area";
import "devextreme-react/radio-group";

const CMSContent = ({ onCancel }) => {
  const axiosService = useMemo(() => new AxiosCalls(), []);
  const { setSuccessMessage, setFailureMessage } = useResultContext();
  const { cmsId } = useParams();
  const navigate = useNavigate();
  const [cmsData, setCMSData] = useState({
    id: "",
    title: "",
    content: "",
    vanity_url: "",
    banner_image: "",
    blurb: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    is_active: ""
  });

  const [originalCMSData, setOriginalCMSData] = useState(null);

  const [tempImageFile, setTempImageFile] = useState(null);

  
  useEffect(() => {
    const fetchCMSData = async () => {
      if (cmsId) {
        try {
          const response = await axiosService.postData(`/underCms/cms/load`, { cmsId: cmsId });
          setCMSData(response.data);
          setOriginalCMSData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
          console.error("Error fetching CMS content data:", error);
          setFailureMessage("Error fetching CMS content data. Please try again.");
        }
      }
    };

    fetchCMSData();
  }, [cmsId]);

  const handleFileChange = (e) => {
    setTempImageFile(e.target.files[0]);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Append cmsData as a JSON string
      formData.append("cmsData", JSON.stringify(cmsData));

      //Append the original data before any updates
      formData.append("originalCMSData", JSON.stringify(originalCMSData));

      // Append image file if selected
      if (tempImageFile) {
        formData.append("file", tempImageFile);
      }

      // Send data to the server
      const endpoint = cmsData.id ? "/underCMS/cms/update" : "/underCMS/cms/add";
      const response = await axiosService.postDataUpload(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data) {
        setSuccessMessage(cmsData.id ? "CMS Content successfully updated." : "CMS Content successfully added.");

        navigate(`/under-cms/content-list`, { replace: true });
      }
    } catch (error) {
      console.error("Error updating CMS Content:", error);
      setFailureMessage("Failed to update CMS Content. Please try again.");
    }
  }, [cmsData, navigate, tempImageFile]);

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
      <p className="cont_heading">CMS Page Info</p>
      <div className="required_fields">* marked are mandatory.</div>
      <form onSubmit={handleSubmit} className="form-container">
        <Form 
            formData={cmsData} 
            colCount={2} 
            labelMode="outside"
            showValidationSummary={true}>

          <GroupItem colCount={1}>
            
            <SimpleItem dataField="title" label={{ text: "Title" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Title is required." />
            </SimpleItem>
            <SimpleItem>
            <div className="input text">
              <label htmlFor="image_upload">Upload Image (1200px*292px)</label>
              <input type="file" id="image_upload" name="temp_image_file" onChange={handleFileChange} />
            </div>
            </SimpleItem>
            <SimpleItem dataField="vanity_url" label={{ text: "Vanity URL" }} editorType="dxTextBox" isRequired>
              <RequiredRule message="Vanity URL is required." />
              <AsyncRule
                validationCallback={(params) => validateVanityURL(params, "cms_pages", cmsData.id)}
                message="Vanity URL must be unique."
              />
            </SimpleItem>
          </GroupItem>

          {/* Group 2 */}
          <GroupItem colCount={1}>
            <SimpleItem dataField="seo_title" label={{ text: "SEO Title" }} editorType="dxTextBox" />
            <SimpleItem dataField="seo_description" label={{ text: "SEO Description" }} editorType="dxTextBox" />
            <SimpleItem dataField="seo_keywords"label={{ text: "SEO Keyword" }} editorType="dxTextBox" />
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

          <GroupItem colCount={1} colSpan={2}>
            {cmsData.banner_image && (
              <div className="image-preview">
                <label htmlFor="banner_image">&nbsp;</label>
                <img src={import.meta.env.VITE_REACT_APP_BASE_URL + '/' + cmsData.banner_image} width="1200" height="292" id="banner_image" alt="Banner Image" />
              </div>
            )}
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
                  uploadURL="/htmlEditor/uploadCMS"
                  
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

export default CMSContent;
