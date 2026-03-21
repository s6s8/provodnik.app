import type { Metadata } from "next";
import { CreateRequestForm } from "@/features/requests/components/public/create-request-form";

export const metadata: Metadata = {
  title: "Создать запрос",
  description: "Оставьте заявку: мы поможем найти группу и предложить цену с местным гидом.",
};

export default function CreateRequestPage() {
  return <CreateRequestForm />;
}

