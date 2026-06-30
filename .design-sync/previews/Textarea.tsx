import { Textarea } from "provodnik-app";
export const Default = () => (
  <Textarea
    style={{ maxWidth: 360 }}
    placeholder="Особые пожелания, ограничения по здоровью или другие детали."
    defaultValue="Хотим начать пораньше и сделать остановку у Поющего бархана."
  />
);
