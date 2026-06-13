type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileAvatar({ name, avatarUrl, className }: ProfileAvatarProps) {
  const initials = getInitials(name) || "FP";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${name} profile`}
        className={className ?? "h-14 w-14 rounded-2xl object-cover"}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={
        className ??
        "flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary"
      }
    >
      {initials}
    </div>
  );
}
