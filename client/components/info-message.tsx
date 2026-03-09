export function InfoMessage({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "info" | "warning" | "error";
}) {
  const textColor =
    type === "info"
      ? "text-neutral-800"
      : type === "warning"
        ? "text-yellow-500"
        : "text-red-500";
  return <span className={`${textColor}`}>{children}</span>;
}
