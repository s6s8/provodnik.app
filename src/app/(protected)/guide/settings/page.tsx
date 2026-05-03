import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function GuideSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Кабинет гида</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Настройки профиля объединены со страницей редактирования профиля.
        </p>
      </div>
      <Button asChild>
        <Link href="/guide/profile">Перейти к профилю</Link>
      </Button>
    </div>
  );
}
