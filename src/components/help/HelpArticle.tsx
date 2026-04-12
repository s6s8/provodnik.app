function markdownToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

export function HelpArticle({ body }: { body: string }) {
  const html = markdownToHtml(body.trim());

  return (
    <div
      className="prose prose-sm max-w-none text-foreground"
      // eslint-disable-next-line react/no-danger -- escaped source; only converter-emitted tags
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
