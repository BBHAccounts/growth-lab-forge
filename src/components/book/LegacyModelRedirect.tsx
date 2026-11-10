import { Navigate, useParams } from "react-router-dom";

export function LegacyModelRedirect({ workspace = false }: { workspace?: boolean }) {
  const { id, modelId } = useParams();
  const target = id ?? modelId;
  return <Navigate replace to={target ? `/book/library/${encodeURIComponent(target)}${workspace ? "/workspace" : ""}` : "/book/library"} />;
}