const AdminOptions= {
    applicationOptions : [
    { id: "admin", name: "CMS Admin" },
    { id: "cbo", name: "Extensions" },
    { id: "distance_calculator", name: "Distance Calculator" },
    { id: "events", name: "Events" },
    { id: "goldenrules", name: "Goldenrules" },
    { id: "goldenrules_backend", name: "Goldenrules Backend" },
    { id: "mhc", name: "MHC" },
    { id: "mountsinai", name: "Mountsinai" },
    { id: "newmd", name: "New MD" },
    { id: "offices", name: "Offices" },
    { id: "smstoken", name: "SMS Token" },
    { id: "urgentcare", name: "Urgent Care" },
    { id: "staffupdate", name: "Staff Update" }
  ],
  
   privilegeOptions : [
    { id: "S", name: "Super User" },
    { id: "N", name: "Normal User" },
    { id: "E", name: "SEO Operation" }
  ],
   // Getter for applicationOptions by ID
   getApplicationNameById(id) {
    const option = this.applicationOptions.find(option => option.id === id);
    return option ? option.name : null;  // Return name or null if not found
  },

  // Getter for privilegeOptions by ID
  getPrivilegeNameById(id) {
    const option = this.privilegeOptions.find(option => option.id === id);
    return option ? option.name : null;  // Return name or null if not found
  }
}
  export default AdminOptions;  