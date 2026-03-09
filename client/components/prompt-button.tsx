import { useRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Pause } from "lucide-react";

export function PromptButton({
  onSubmit,
  buttonText,
  isLoading,
}: {
  onSubmit: (prompt?: string) => void;
  buttonText: string;
  isLoading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    onSubmit(inputRef.current?.value);
  };

  return (
    <div className="flex w-full">
      <Input
        ref={inputRef}
        className="h-7! bg-neutral-400 text-neutral-white italic placeholder:text-white focus:placeholder-neutral-500 rounded-l-lg border-neutral-400 rounded-r-none! px-2! w-17! border-r-neutral-200 border-r text-sm overflow-hidden transition-all duration-300 focus:bg-white focus:w-full! focus:flex"
        placeholder="Prompt"
      />

      <Button
        onClick={handleSubmit}
        className="text-sm rounded-lg direction-normal rounded-l-none shrink-0 px-3! h-7! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
      >
        {isLoading ? (
          <Pause className="size-3 mr-1.5 -ml-0.5 fill-current" />
        ) : null}
        {buttonText}
      </Button>
    </div>
  );
}
