import AxiosCalls from "./axios-calls.service";

const axiosService = new AxiosCalls();

/**
 * API validation function for vanity_url field.
 * Calls the API to check if the vanity_url is valid.
 *
 * @param {object} params - Validation callback params from DevExtreme
 * @param {string} type - The type of vanity URL (e.g., "cms_pages")
 * @param {string} id - The ID of the current record (if updating)
 * @returns {Promise<boolean|string>} - Returns `true` if valid, or rejects with an error message if invalid
 */
export const validateVanityURL = async (params, type, id) => {
  const vanityUrl = params.value;

  if (!vanityUrl) return true; // Skip API call if the field is empty

  try {
    const response = await axiosService.postData(`/validate/vanityURL`, {
      vanity_url: vanityUrl,
      id: id || "", // Pass existing ID (if any) to allow updates
      type: type,
    });

    if (!response.data) {
      return Promise.reject({ message: "Vanity URL must be unique." });
    }

    return true; // Validation passed
  } catch (error) {
    console.error("Error validating Vanity URL:", error);
    return Promise.reject({ message: "Error validating the Vanity URL. Please try again." });
  }
};
