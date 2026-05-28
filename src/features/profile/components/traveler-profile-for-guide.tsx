import { ProfileAvatar } from "@/components/profile-avatar";

import type { TravelerProfile } from "./traveler-profile-form";
import { findContactInBio } from "../validation/anti-contact";

export function TravelerProfileForGuide({
  profile,
}: {
  profile: TravelerProfile;
}) {
  const age = profile.birth_year
    ? new Date().getFullYear() - profile.birth_year
    : null;
  const bio =
    profile.bio && !findContactInBio(profile.bio) ? profile.bio : null;

  return (
    <article className="space-y-2">
      <header className="flex items-center gap-3">
        <ProfileAvatar profile={profile} size={64} />
        <h2 className="text-xl font-medium">{profile.full_name}</h2>
        {age != null ? (
          <span className="text-muted-foreground">{age} лет</span>
        ) : null}
      </header>
      {bio ? <p>{bio}</p> : null}
      {profile.home_city ? <p>Родной город: {profile.home_city}</p> : null}
      {profile.languages?.length ? (
        <p>Языки: {profile.languages.join(", ")}</p>
      ) : null}
    </article>
  );
}
