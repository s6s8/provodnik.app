import { Tabs, TabsList, TabsTrigger, TabsContent } from "provodnik-app";
export const Default = () => (
  <Tabs defaultValue="open" style={{ maxWidth: 380 }}>
    <TabsList>
      <TabsTrigger value="open">Открытые</TabsTrigger>
      <TabsTrigger value="mine">Мои заявки</TabsTrigger>
      <TabsTrigger value="done">Завершённые</TabsTrigger>
    </TabsList>
    <TabsContent value="open" style={{ paddingTop: 12, fontSize: 14 }}>
      3 открытые сборные группы в Элисте.
    </TabsContent>
  </Tabs>
);
