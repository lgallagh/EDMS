import React from "react";
import Header from "./header.component";
import LeftMenu from "./left-menu.component";
import { Routes, Route, Navigate } from "react-router-dom";

import DoctorDetailsList from "../../doctorManagement/components/doctor-details-list.component";
import DoctorServiceAltTextList from "../../doctorManagement/components/doctor-service-alt-text-list.component";
import AdminUserList from "../../adminUtilities/components/admin-user-list.component";
import LanguageList from "../../adminUtilities/components/language-list.component";
import CountyList from "../../officeManagement/components/county-list.component";
import AudiologistDetailsList from "../../audiologistManagement/components/audiologist-details-list.component";
import PhysicianAssistantDetailsList from "../../physicianAssistantManagement/components/physician-assistant-details-list.component";
import NPDetailsList from "../../npManagement/components/np-details-list.component";
import SLPDetailsList from "../../slpManagement/components/slp-details-list.component";
import InternDetailsList from "../../internManagement/components/intern-details-list.component";
import CMSContentList from "../../underCMS/components/cms-content-list.component";
import ServiceDetailsList from "../../serviceSection/components/service-list.component";
import HospitalDetailsList from "../../hospitalAffiliation/components/hospital-list.component";
import HospitalAffiliationList from "../../hospitalAffiliation/components/hospital-affiliation-list.component";
import OfficeList from "../../officeManagement/components/office-list.component";
import OfficeWiseAlertList from "../../officeManagement/components/office-wise-alert-list.component";
import InsuranceList from "../../insuranceManagement/components/insurance-list.component";
import AffiliationList from "../../insuranceManagement/components/affiliation-list.component";
import EmailTemplateList from "../../manageEmailTemplates/components/cms-email-template-list.component";



const ContainerPage = () => {
  
  return (
    <div className="outer_main">
      {/* Header */}
      <div className="wrapper">
        <Header />
      </div>

      {/* Content */}
      <div className="wrapper">
        <div id="content">
          <LeftMenu />
          <div className="bradcum"></div>
          <div className="cont_right">
          <Routes>
            {/* List all routes for the application here */}
          <Route path="/doctor-management/details/*" element={<DoctorDetailsList />} />
          <Route path="/doctor-management/doctor-service-alt-text/*" element={<DoctorServiceAltTextList />} />
          <Route path="/audiologist-management/details/*" element={<AudiologistDetailsList />} />
          <Route path="/physician-assistant-management/details/*" element={<PhysicianAssistantDetailsList />} />
          <Route path="/np-management/details/*" element={<NPDetailsList />} />
          <Route path="/slp-management/details/*" element={<SLPDetailsList />} />
          <Route path="/intern-management/details/*" element={<InternDetailsList />} />
          <Route path="/admin-utilities/manage-admin/*" element={<AdminUserList />} />
          <Route path="/admin-utilities/language-list/*" element={<LanguageList />} />
          <Route path="/office-management/county-list/*" element={<CountyList />} />
          <Route path="/office-management/office-list/*" element={<OfficeList />} />
          <Route path="/office-management/office-wise-alert/*" element={<OfficeWiseAlertList />} />
          <Route path="/under-cms/content-list/*" element={<CMSContentList />} />
          <Route path="/service-section/service-list/*" element={<ServiceDetailsList />} />
          <Route path="/insurance-management/insurance-list/*" element={<InsuranceList />} />
          <Route path="/insurance-management/affiliation/:type/*" element={<AffiliationList />} />
          <Route path="/hospital-affiliation/hospital-list/*" element={<HospitalDetailsList />} />
          <Route path="/hospital-affiliation/hospital-affiliation-list/*" element={<HospitalAffiliationList />} />
          <Route path="/manage-email-templates/cms-email-template-list/*" element={<EmailTemplateList />} />
          {/* Set a default page to hit if nothing else is a match */}
          <Route path="*" element={<Navigate to="/office-management/office-list" replace />} />
          </Routes>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="wrapper">
        <div id="footer">
          <div className="footer_contner">
            &copy; 1998 - {new Date().getFullYear()} ENT & Allergy Associates, LLP. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerPage;
