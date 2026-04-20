import Markdown from "react-markdown";

export function HelpArticle({ body }: { body: string }) {
  return (
    <div className="prose prose-sm max-w-none text-foreground">
      <Markdown>{body}</Markdown>
    </div>
  );
}
