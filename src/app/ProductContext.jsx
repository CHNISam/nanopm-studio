import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getProject, getWorkspaces, openProject } from "../api/client.js";

const emptyProject = {
  project: "",
  items: [],
  opportunities: [],
  solutions: [],
  evidence: [],
  signals: [],
  recent: [],
  diagnostics: [],
};

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [data, setData] = useState(null);
  const [workspaces, setWorkspaces] = useState({ current: "", recent: [] });
  const [error, setError] = useState("");
  const generation = useRef(0);

  async function refresh({ quiet = false } = {}) {
    const startedAt = generation.current;
    const results = await Promise.allSettled([getProject(), getWorkspaces()]);
    if (startedAt !== generation.current) return;
    const [projectResult, workspaceResult] = results;
    if (projectResult.status === "fulfilled") {
      setData(projectResult.value);
      setError("");
    } else {
      setData((current) => current || emptyProject);
      if (!quiet || !data?.project) setError(projectResult.reason.message);
    }
    if (workspaceResult.status === "fulfilled")
      setWorkspaces(workspaceResult.value);
  }

  async function selectProject(path) {
    generation.current += 1;
    try {
      const next = await openProject(path);
      setData(next);
      setError("");
      setWorkspaces(await getWorkspaces());
      return true;
    } catch (reason) {
      setError(reason.message);
      setWorkspaces(await getWorkspaces().catch(() => workspaces));
      return false;
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(() => refresh({ quiet: true }), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ProductContext.Provider
      value={{ data, error, workspaces, refresh, selectProject }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  return useContext(ProductContext);
}
