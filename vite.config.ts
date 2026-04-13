import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const resolveBasePath = (): string => {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return "/";
  }

  const [, repoName = ""] = repository.split("/");
  return repoName ? `/${repoName}/` : "/";
};

export default defineConfig({
  plugins: [react()],
  base: resolveBasePath()
});
