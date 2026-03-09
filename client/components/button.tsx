import { Button as BaseButton } from "@base-ui/react/button";
import clsx from "clsx";

export function Button({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button">) {
  return (
    <BaseButton
      type="button"
      className={clsx(
        "flex items-center justify-center h-9 px-3.5 m-0 outline-0 border border-neutral-300 font-inherit font-normal leading-6 text-neutral-900 select-none hover:data-disabled:bg-neutral-50 hover:bg-neutral-100/50 active:data-disabled:bg-neutral-50 active:bg-neutral-300  active:border-t-neutral-300 active:data-disabled:shadow-none active:data-disabled:border-t-neutral-200 focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-disabled:text-neutral-500",
        className,
      )}
      {...props}
    />
  );
}
