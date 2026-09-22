export async function getProject() {
  return request("/api/project");
}

export async function getWorkspaces() {
  return request("/api/workspaces");
}

export async function openProject(path) {
  return request("/api/project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
}

async function request(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "NanoPM Studio request failed.");
  return body;
}
