/**
 * Helper function to download a file with a custom filename
 * @param url - The URL of the file to download
 * @param filename - The desired filename (without extension, will be inferred from URL)
 */
export function downloadFile(url: string, filename: string): void {
  // Extract file extension from URL if available
  const urlExtension = url.split(".").pop()?.split("?")[0] || "";
  const extension = urlExtension && urlExtension.length < 6 ? `.${urlExtension}` : "";
  
  // Create a temporary anchor element
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}${extension}`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper function to download a file from blob with custom filename
 * @param blob - The blob data
 * @param filename - The desired filename (with extension)
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

