import { Avatar, AvatarFallback } from "provodnik-app";
export const Group = () => (
  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
    <Avatar><AvatarFallback>АП</AvatarFallback></Avatar>
    <Avatar><AvatarFallback>БД</AvatarFallback></Avatar>
    <Avatar><AvatarFallback>МК</AvatarFallback></Avatar>
  </div>
);
