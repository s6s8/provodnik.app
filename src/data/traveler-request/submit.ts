import {
  travelerRequestSchema,
  type TravelerRequest,
} from "@/data/traveler-request/schema";

export type TravelerRequestSubmission = {
  status: "local";
  request: TravelerRequest;
};

export async function submitTravelerRequest(
  input: TravelerRequest,
): Promise<TravelerRequestSubmission> {
  const request = travelerRequestSchema.parse({
    ...input,
    destination: input.destination.trim(),
    notes: input.notes?.trim() ?? "",
  });

  return {
    status: "local",
    request: {
      ...request,
      notes: request.notes || undefined,
    },
  };
}
