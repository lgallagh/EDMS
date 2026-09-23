import axiosInstance from "./axios-instance.service";
import axiosUploadInstance from "./axios-upload-instance.service";

/**
 * Implementation of generic calls with our configured Axios instance.
 */
class AxiosCalls {
  constructor() {}

  getData(endpoint, config) {
    return axiosInstance.get(endpoint, config);
  }

  postData(endpoint, parameter) {
    return axiosInstance.post(endpoint, parameter);
  }

  postDataUpload(endpoint, parameter) {
    return axiosUploadInstance.post(endpoint, parameter);
  }
}

export default AxiosCalls;
