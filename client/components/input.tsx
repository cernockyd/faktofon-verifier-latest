import * as React from "react";
import clsx from "clsx";
import { Input as BaseInput } from "@base-ui/react/input";

export const Input = React.forwardRef<HTMLInputElement, BaseInput.Props>(
  function Input(
    { className, ...props }: BaseInput.Props,
    forwardedRef: React.ForwardedRef<HTMLInputElement>,
  ) {
    return (
      <BaseInput
        ref={forwardedRef}
        className={clsx(
          "h-10 w-full rounded-md pl-3.5 focus:outline-1 focus:-outline-offset-1 focus:outline-neutral-400 placeholder:text-neutral-500",
          className,
        )}
        {...props}
      />
    );
  },
);
