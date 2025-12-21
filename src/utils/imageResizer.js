/**
 * Resizes an image file to specified dimensions while maintaining aspect ratio
 * @param {File} file - The image file to resize
 * @param {number} maxWidth - Maximum width in pixels (default: 200)
 * @param {number} maxHeight - Maximum height in pixels (default: 80)
 * @param {number} quality - Image quality 0-1 (default: 0.9)
 * @returns {Promise<File>} - Resized image as File object
 */
export const resizeSignatureImage = (file, maxWidth = 200, maxHeight = 80, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("File must be an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        // Scale down if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio);

          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and resize
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to resize image"));
              return;
            }

            // Create new File object with original name
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Converts an image file to base64 data URL
 * @param {File} file - The image file
 * @returns {Promise<string>} - Base64 data URL
 */
export const imageToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
};

