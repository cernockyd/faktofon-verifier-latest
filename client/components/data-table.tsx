import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight, Clock } from "lucide-react";
import type { ReactNode } from "react";

export const formatPercentage = (decimal: number) => `${decimal * 100} %`;
export const formatBoolean = (value: boolean) => (value ? "ano" : "ne");

import { Check, X, AlertTriangle, Loader2 } from "lucide-react";
import clsx from "clsx";

export type Status = "success" | "error" | "warning" | "waiting";

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
  }[mainStatus];

  const iconWrapperClass = {
    success: "rounded-full bg-blue-600 p-1",
    error: "",
    warning: "text-orange-500",
    waiting: "text-neutral-400",
  }[mainStatus];

  const iconClass = {
    success: "size-3 stroke-3 text-white ",
    error: "size-3 text-white -m-px",
    warning: "size-5 text-orange-500",
    waiting: "size-5 text-neutral-400",
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

type Formatter<T> = (value: T) => ReactNode;

type TableKey<T> = {
  name: string;
  hideTitle?: true;
  format: Formatter<T>;
};

export type TableKeys = Record<string, TableKey<any>>;

export const DataTable = ({
  data,
  triggerName,
  tableKeys,
  pinnedKeys,
}: {
  data?: any;
  triggerName: string;
  tableKeys: TableKeys;
  pinnedKeys?: TableKeys;
}) => {
  return (
    <Collapsible.Root className="">
      <Collapsible.Trigger
        disabled={!data ? true : false}
        className={clsx(
          "group bg-white w-full pr-3 py-1.5 text-sm focus-visible:outline active:bg-neutral-100",
          {
            "pl-9": !data,
            "pl-3": data,
          },
        )}
      >
        <div className="w-full flex items-center gap-2">
          {data && (
            <ChevronRight className="size-4 transition-all ease-out group-data-panel-open:rotate-90" />
          )}
          <span className="text-neutral-900 font-medium mr-auto shrink-0 pr-2">
            {triggerName}
          </span>
          {data
            ? tableKeys["status"].format(data["status"])
            : tableKeys["status"].format(null)}
        </div>
      </Collapsible.Trigger>
      {data && pinnedKeys && (
        <div className="pt-4 border-t border-neutral-300 pl-6 pr-3 bg-white pointer-events-auto">
          {Object.entries(pinnedKeys).map(([key]) => (
            <>{pinnedKeys[key].format(data[key])}</>
          ))}
        </div>
      )}
      {data && (
        <Collapsible.Panel className="flex [&[hidden]:not([hidden='until-found'])]:hidden h-(--collapsible-panel-height) h-max-[500px] overflow-y-scroll border-t border-neutral-200 flex-col justify-end text-sm transition-all ease-out data-ending-style:h-0 data-starting-style:h-0 duration-150">
          <div className="w-full pt-1 h-full pb-4 bg-neutral-100 text-left text-sm text-neutral-500">
            {Object.entries(tableKeys).map(([key]) => {
              if (key == "separator" && tableKeys[key]) {
                return <div className=""></div>;
              }
              if (tableKeys[key].hideTitle) return null;
              return (
                <div
                  key={key}
                  className={clsx(
                    "grid group/row bg-neutral-100 pl-8 last:border-none border-neutral-200 grid-cols-12",
                    {
                      "hover:bg-neutral-200": !tableKeys[key].ignoreHover,
                    },
                  )}
                >
                  {!tableKeys[key].hideTitle && (
                    <div
                      className={
                        "col-span-3 text-neutral-800 " +
                        (tableKeys[key].hideTitle ? "" : "py-1.5")
                      }
                    >
                      {tableKeys[key].name}
                    </div>
                  )}
                  <div
                    className={
                      "flex-1 " +
                      (tableKeys[key].hideTitle
                        ? "col-span-12 bg-white"
                        : "px-2 py-1.5 col-span-9")
                    }
                  >
                    {tableKeys[key].format(data[key])}
                  </div>
                </div>
              );
            })}
          </div>
        </Collapsible.Panel>
      )}
    </Collapsible.Root>
  );
};
