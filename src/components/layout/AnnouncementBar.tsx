type AnnouncementBarProps = {
  message?: string;
};

export function AnnouncementBar({
  message = "Discover the latest MALYK collection",
}: AnnouncementBarProps) {
  return (
    <div className="announcement-bar">
      <p>{message}</p>
    </div>
  );
}
