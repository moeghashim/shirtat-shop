import { siGithub } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";

export function GitHubRepositoriesMenu() {
  return (
    <Button
      nativeButton={false}
      variant="ghost"
      size="icon"
      render={<a href="https://github.com/moeghashim/tenboards" target="_blank" rel="noreferrer" />}
      aria-label="tenboards on GitHub"
    >
      <SimpleIcon icon={siGithub} className="fill-current" />
    </Button>
  );
}
