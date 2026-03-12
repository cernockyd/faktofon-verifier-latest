import { Collapsible } from "@base-ui/react/collapsible";
import type { ReactNode } from "react";
import { ChevronRight, Clock, Check, AlertTriangle, Minus } from "lucide-react";
import clsx from "clsx";

export const formatPercentage = (decimal: number) => `${decimal * 100} %`;
export const formatBoolean = (value: boolean) => (value ? "ano" : "ne");

type Formatter<T> = (value: T) => ReactNode;

type TableKey<T> = {
  name: string;
  hideTitle?: true;
  format: Formatter<T>;
};

export type TableKeys = Record<string, TableKey<any>>;

export type Status = "success" | "error" | "warning" | "pass" | "waiting";

export const StatusSummary = ({
  mainStatus,
  text,
}: {
  text?: string;
  mainStatus: Status;
}) => {
  const Icon = {
    success: Check,
    error: () => (
      <div className="size-5 bg-red-600 [clip-path:polygon(30%_0%,70%_0%,100%_30%,100%_70%,70%_100%,30%_100%,0%_70%,0%_30%)] text-white leading-5 font-semibold text-center">
        !
      </div>
    ),
    warning: AlertTriangle,
    waiting: Clock,
    pass: Minus,
  }[mainStatus];

  const iconWrapperClass = {
    success: "rounded-full bg-blue-600 p-1",
    error: "",
    warning: "text-orange-500",
    waiting: "text-neutral-400",
    pass: "rounded-full bg-purple-600 p-1",
  }[mainStatus];

  const iconClass = {
    success: "size-3 stroke-3 text-white ",
    error: "size-3 text-white -m-px",
    warning: "size-5 text-orange-500",
    waiting: "size-5 text-neutral-400",
    pass: "size-3 stroke-3 text-white ",
  }[mainStatus];

  return (
    <div className="text-sm py-1 flex pl-1 items-center">
      {text}
      <div
        className={clsx(
          "ml-3 inline-flex items-center justify-center",
          iconWrapperClass,
        )}
      >
        <Icon className={clsx(mainStatus === "waiting", iconClass)} />
      </div>
    </div>
  );
};

export const DataTable = {
  Root({ children }: { children: ReactNode }) {
    return <Collapsible.Root>{children}</Collapsible.Root>;
  },

  Trigger({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
    return (
      <Collapsible.Trigger
        disabled={disabled}
        className={clsx(
          "group bg-white w-full pr-3 py-1.5 text-sm focus-visible:outline active:bg-neutral-100",
          {
            "pl-9": disabled,
            "pl-3": !disabled,
          },
        )}
      >
        <div className="w-full flex items-center gap-2">
          {!disabled && (
            <ChevronRight className="size-4 transition-all ease-out group-data-panel-open:rotate-90" />
          )}
          {children}
        </div>
      </Collapsible.Trigger>
    );
  },

  TriggerTitle({ children }: { children: ReactNode }) {
    return (
      <span className="text-neutral-900 font-medium mr-auto shrink-0 pr-2">
        {children}
      </span>
    );
  },

  Pinned({ children }: { children: ReactNode }) {
    return (
      <div className="pt-4 border-t border-neutral-200 pl-6 pr-3 bg-white pointer-events-auto">
        {children}
      </div>
    );
  },

  Panel({ children }: { children: ReactNode }) {
    return (
      <Collapsible.Panel className="flex [&[hidden]:not([hidden='until-found'])]:hidden h-(--collapsible-panel-height) h-max-[500px] overflow-y-scroll border-t border-neutral-200 flex-col justify-end text-sm transition-all ease-out data-ending-style:h-0 data-starting-style:h-0 duration-150">
        <div className="w-full pt-1 h-full pb-4 bg-neutral-100 text-left text-sm text-neutral-500">
          {children}
        </div>
      </Collapsible.Panel>
    );
  },

  Row({
    name,
    children,
    hideTitle,
  }: {
    name?: string;
    children: ReactNode;
    hideTitle?: boolean;
  }) {
    if (hideTitle) {
      return (
        <div className="grid grid-cols-12 pl-8">
          <div className="col-span-12 bg-white">{children}</div>
        </div>
      );
    }

    return (
      <div className="grid group/row bg-neutral-100 pl-8 last:border-none border-neutral-200 grid-cols-12">
        <div className="col-span-3 text-neutral-800 py-1.5">{name}</div>
        <div className="px-2 py-1.5 col-span-9">{children}</div>
      </div>
    );
  },

  Separator() {
    return <div className="h-px bg-neutral-200 my-2" />;
  },
};
