import { Alert, AlertTitle, AlertDescription } from "provodnik-app";
export const Default = () => (
  <Alert style={{ maxWidth: 380 }}>
    <AlertTitle>Контакты скрыты</AlertTitle>
    <AlertDescription>Телефон гида станет виден после подтверждения брони.</AlertDescription>
  </Alert>
);
