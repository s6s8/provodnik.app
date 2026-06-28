import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from "provodnik-app";
export const Default = () => (
  <Card style={{ maxWidth: 360 }}>
    <CardHeader>
      <CardTitle>Элиста · Калмыкия</CardTitle>
      <CardDescription>Сборная группа · 21 июня · от 6 человек</CardDescription>
    </CardHeader>
    <CardContent>
      <p style={{ margin: 0, fontSize: 14 }}>
        Обзорная экскурсия по буддийским храмам и степи. Местный гид с государственной аккредитацией.
      </p>
    </CardContent>
    <CardFooter>
      <Button>Присоединиться</Button>
    </CardFooter>
  </Card>
);
