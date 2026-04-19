const buildUploadsBaseUrl = () => {
  const rawApiUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development" ? "http://localhost:3000" : "");

  return String(rawApiUrl || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
};

export const resolveProductoImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  if (
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  const uploadsBaseUrl = buildUploadsBaseUrl();
  if (!uploadsBaseUrl) {
    return imageUrl;
  }

  return `${uploadsBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};

export const revokeIfBlobUrl = (url) => {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};
