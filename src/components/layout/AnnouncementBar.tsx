type AnnouncementBarProps = {
  message?: string;
};

export function AnnouncementBar({
  message = "Discover the new collection",
}: AnnouncementBarProps) {
  return (
    <div className="announcement-bar">
      <p>{message}</p>
    </div>
  );
}
