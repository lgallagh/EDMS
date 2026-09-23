import React, { useRef, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import AxiosCalls from '../../shared/services/axios-calls.service';

const HTMLEditorComponent = ({
  value,
  onValueChanged,
  uploadURL,       // If provided, the "Upload file" option appears
}) => {
  const editorRef = useRef(null);

  const handleEditorChange = useCallback((newValue, editor) => {
    editorRef.current = editor;
    onValueChanged(newValue);
  }, [onValueChanged]);

  // Custom file_picker_callback that displays a modal with options.
  const filePickerCallback = (callback, currentValue, meta) => {
    if (meta.filetype === "image") {
      // Create modal overlay
      const modalOverlay = document.createElement("div");
      modalOverlay.style.position = "fixed";
      modalOverlay.style.top = "0";
      modalOverlay.style.left = "0";
      modalOverlay.style.width = "100%";
      modalOverlay.style.height = "100%";
      modalOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
      modalOverlay.style.display = "flex";
      modalOverlay.style.alignItems = "center";
      modalOverlay.style.justifyContent = "center";
      modalOverlay.style.zIndex = "9999";

      // Create dialog container
      const dialog = document.createElement("div");
      dialog.style.backgroundColor = "white";
      dialog.style.padding = "20px";
      dialog.style.borderRadius = "4px";
      dialog.style.boxShadow = "0 0 10px rgba(0,0,0,0.25)";
      dialog.style.textAlign = "center";

      const title = document.createElement("h3");
      title.textContent = "Select Image Insertion Option";
      title.style.marginTop = "0";
      dialog.appendChild(title);

      // Create dropdown select element
      const select = document.createElement("select");
      select.style.width = "100%";
      select.style.marginBottom = "20px";
      
      // Always add URL and base64 options
      const optionLink = document.createElement("option");
      optionLink.value = "link";
      optionLink.textContent = "Insert image URL";
      select.appendChild(optionLink);
      
      const optionBase64 = document.createElement("option");
      optionBase64.value = "base64";
      optionBase64.textContent = "Embed as Base64";
      select.appendChild(optionBase64);
      
      // Only add "Upload file" option if uploadURL is provided.
      if (uploadURL) {
        const optionUpload = document.createElement("option");
        optionUpload.value = "upload";
        optionUpload.textContent = "Upload file";
        select.appendChild(optionUpload);
      }
      
      dialog.appendChild(select);

      // Create OK and Cancel buttons.
      const okButton = document.createElement("button");
      okButton.textContent = "OK";
      okButton.style.marginRight = "10px";
      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Cancel";
      dialog.appendChild(okButton);
      dialog.appendChild(cancelButton);

      modalOverlay.appendChild(dialog);
      document.body.appendChild(modalOverlay);

      // OK button action.
      okButton.onclick = () => {
        const mode = select.value;
        document.body.removeChild(modalOverlay);
        if (mode === "link") {
          const imageUrl = window.prompt("Enter the image URL:", "");
          if (imageUrl) {
            callback(imageUrl);
          }
        } else if (mode === "base64") {
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.onchange = function() {
            const file = this.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
              callback(e.target.result);
            };
            reader.readAsDataURL(file);
          };
          input.click();
        } else if (mode === "upload") {
          if (!uploadURL) {
            alert("Upload URL is not configured.");
            return;
          }
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.onchange = function() {
            const file = this.files[0];
            const formData = new FormData();
            formData.append("file", file, file.name);
            const axiosService = new AxiosCalls();
            axiosService.postDataUpload(uploadURL, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            })
              .then(response => {
                const result = response.data;
                if (result && result.url) {
                  // strip any leading slash, normalize backslashes to slashes
                  const rel = result.url.replace(/^\/+/, '').replace(/\\/g, '/');
                  // build the full API URL; we will save as just the relative path, but need to include the BASE info to show it on this site
                  const abs = BASE + rel;
                  callback(abs, {
                    alt: file.name
                  });
                } else {
                  alert("Image upload failed: No URL returned.");
                }
              })
              .catch(error => {
                alert("Image upload failed: " + error.message);
              });
          };
          input.click();
        } else {
          const imageUrl = window.prompt("Enter the image URL:", "");
          if (imageUrl) {
            callback(imageUrl);
          }
        }
      };

      // Cancel button action.
      cancelButton.onclick = () => {
        document.body.removeChild(modalOverlay);
      };
    }
  };

  let BASE = import.meta.env.VITE_REACT_APP_BASE_URL;
  if (!BASE.endsWith('/')) BASE = BASE + '/';

  const initConfig = {
    height: 400,
    menubar: false,
    plugins:
      'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount codesample',
    toolbar:
      'cut copy paste | undo redo | link unlink | image | bold italic underline strikethrough | subscript superscript | removeformat | numlist bullist | alignleft aligncenter alignright alignjustify | forecolor backcolor | code',
    license_key: 'gpl',
    convert_urls: true,        
    relative_urls: false,      
    remove_script_host: false, 
    document_base_url: BASE,
    urlconverter_callback: (url, node, on_save) => {
      // normalize backslashes
      let u = url.replace(/\\/g, '/');

      // handle only relative URLs
      if (u.startsWith('/') && !u.startsWith('//')) {
        if (!on_save) {
          // while still working in the editor, include the BASE so the image will display
          return BASE + u.slice(1);
        }
        // on save leave the leading slash so DB sees "/userfiles/..."
        return u;
      }
      // if someone pasted an absolute BASE-url, strip it on save
      if (on_save && u.startsWith(BASE)) {
        return '/' + u.slice(BASE.length);
      }
      return u;
    },
    setup: (editor) => {
      // 1) On load, rewrite any backslashes & drop leading slash so TinyMCE picks up the base
      editor.on('BeforeSetContent', (e) => {
        if (!e.content) return;
        e.content = e.content.replace(
          /<img([^>]*?)src=(['"])(\/(?!\/)[^'"]+)\2([^>]*?>)/gi,
          (_match, beforeAttrs, quote, rawPath, afterAttrsAndClose) => {
            // normalize backslashes to slashes, strip leading slash
            const cleanPath = rawPath.replace(/\\/g, '/').replace(/^\//, '');
            // rebuild the tag: <img [attrs before] src="[BASE][path]" [attrs and closing] 
            return `<img${beforeAttrs}src=${quote}${BASE}${cleanPath}${quote}${afterAttrsAndClose}`;
          }
        );
      });

      // 2) Just before TinyMCE returns the HTML, strip out BASE so only the relative path is saved to the DB
      editor.on('GetContent', (e) => {
        if (!e.content) return;
        const esc = BASE.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        e.content = e.content.replace(new RegExp(esc, 'g'), '');
      });
    }
  };

  initConfig.file_picker_callback = filePickerCallback;

  return (
    <div>
      <Editor
        initialValue={value}
        tinymceScriptSrc={`${import.meta.env.VITE_REACT_APP_STATIC_PATH}/js/tinymce/tinymce.min.js`}
        apiKey=""
        init={initConfig}
        onEditorChange={handleEditorChange}
      />
    </div>
  );
};

export default React.memo(HTMLEditorComponent);
