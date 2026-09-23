import authService from "../services/auth.service";

const menuData = [
    {
      id: 1,
      title: "Admin Utilities",
      icon: "fa fa-institution",
      items: [
        { id: 11, title: "Manage Admin Users", path: "/admin-utilities/manage-admin", icon: "fa fa-angle-double-right" },
        { id: 12, title: "Language List", path: "/admin-utilities/language-list", icon: "fa fa-angle-double-right" },
      ],
    },
    {
      id: 2,
      title: "Office Management",
      icon: "fa fa-building",
      items: [
        { id: 21, title: "County List", path: "/office-management/county-list", icon: "fa fa-angle-double-right" },
        { id: 22, title: "Office List", path: "/office-management/office-list", icon: "fa fa-angle-double-right" },
        { id: 23, title: "Office Wise Alert Message", path: "/office-management/office-wise-alert", icon: "fa fa-angle-double-right" },
      ],
    },
    {
      id: 3,
      title: "Insurance Management",
      icon: "fa fa-umbrella",
      items: [
        { id: 31, title: "Insurance List", path: "/insurance-management/insurance-list", icon: "fa fa-angle-double-right" },
        { id: 32, title: "Insurance Doctor Affiliation", path: "/insurance-management/affiliation/doctor", icon: "fa fa-angle-double-right" },
        { id: 33, title: "Insurance Audio Affiliation", path: "/insurance-management/affiliation/audiologist", icon: "fa fa-angle-double-right" },
        { id: 34, title: "Insurance Physician Assistants Affiliation", path: "/insurance-management/affiliation/PA", icon: "fa fa-angle-double-right" },
      ],
    },
    {
      id: 4,
      title: "Doctor Management",
      icon: "fa fa-user-md",
      items: [
        { id: 41, title: "Doctors Details", path: "/doctor-management/details", icon: "fa fa-angle-double-right" },
        { id: 42, title: "Doctor Service Alternate Text", path: "/doctor-management/doctor-service-alt-text", icon: "fa fa-angle-double-right" },
      ],
    },
    {
      id: 5,
      title: "Audiologist Management",
      icon: "fa fa-music",
      items: [
        { id: 51, title: "Audiologist Details", path: "/audiologist-management/details", icon: "fa fa-angle-double-right" },
      ],
    },
    {
      id: 6,
      title: "ENTA Professionals",
      icon: "fa fa-desktop",
      items: [
        {
          id: 61,
          title: "Physician Assistants Management",
          icon: "fa fa-users",
          items: [
            { id: 611, title: "Physician Assistants Details", path: "/physician-assistant-management/details", icon: "fa fa-angle-double-right" }
          ]
        },
        {
          id: 62,
          title: "SLP Management",
          icon: "fa fa-users",
          items: [
            { id: 621, title: "SLP Details", path: "/slp-management/details", icon: "fa fa-angle-double-right" }
          ]
        },
        {
          id: 63,
          title: "NP Management",
          icon: "fa fa-users",
          items: [
            { id: 631, title: "NP Details", path: "/np-management/details", icon: "fa fa-angle-double-right" }
          ]
        },
        {
          id: 64,
          title: "Intern Management",
          icon: "fa fa-users",
          items: [
            { id: 641, title: "Intern Details", path: "/intern-management/details", icon: "fa fa-angle-double-right" }
          ]
        }
      ],
    },
    {
      id: 7,
      title: "Under CMS",
      icon: "fa fa-desktop",
      items: [
        {
          id: 71,
          title: "CMS Pages",
          icon: "fa fa-th-list",
          items: [
            { id: 711, title: "List of Contents", path: "/under-cms/content-list", icon: "fa fa-angle-double-right" }
          ]
        }
      ],
    },
    {
      id: 8,
      title: "Service Section",
      icon: "fa fa-desktop",
      items: [
        { id: 81, title: "List of Services", path: "/service-section/service-list", icon: "fa fa-angle-double-right" },
      ],
    },
    {
      id: 9,
      title: "Hospital Affiliation",
      icon: "fa fa-hospital-o",
      items: [
        { id: 91, title: "Hospital List", path: "/hospital-affiliation/hospital-list", icon: "fa fa-angle-double-right" },
        { id: 92, title: "Hospital Affiliation", path: "/hospital-affiliation/hospital-affiliation-list", icon: "fa fa-angle-double-right" },
      ],
    },
    {
      id: 10,
      title: "Manage Email Templates",
      icon: "fa fa-eye",
      items: [
        { id: 101, title: "CMS Email Templates List", path: "/manage-email-templates/cms-email-template-list", icon: "fa fa-angle-double-right" },
      ],
    },
    {
      id: 11,
      title: "Sign Off",
      icon: "fa fa-sign-out",
      action: (contextLogout) => authService.logout(contextLogout)
    },
  ];

  export default menuData;