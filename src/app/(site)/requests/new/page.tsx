import type { Metadata } from "next";
import { CreateRequestScreen } from "@/features/requests/components/create-request-screen";

export const metadata: Metadata = {
  title: "Создать запрос",
  description: "Оставьте заявку: мы поможем найти группу и предложить цену с местным гидом.",
};

export default function CreateRequestPage() {
  return <CreateRequestScreen />;
}

