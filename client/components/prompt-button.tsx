import { useRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Pause } from "lucide-react";

export function PromptButton({
  onSubmit,
  buttonText,
  placeholderText = "Prompt",
  isLoading,
}: {
  onSubmit: (prompt: string) => void;
  buttonText: string;
  isLoading: boolean;
  placeholderText?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    console.log("handle submit");
    onSubmit(formData.get("prompt") as string);
    formRef.current?.reset();
  };

  return (
    <form ref={formRef} className="flex w-full" action={handleSubmit}>
      <Input
        className="h-auto! bg-white placeholder:italic rounded-lg! px-2! w-17! text-sm overflow-hidden transition-all duration-300 focus:bg-white focus:w-full! focus:flex"
        placeholder={placeholderText}
        autoComplete="off"
        name="prompt"
      />

      <Button
        type="submit"
        className="text-sm rounded-lg direction-normal ml-1.5 shrink-0 px-2! h-auto! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
      >
        {isLoading ? (
          <Pause className="size-3 mr-1.5 -ml-0.5 fill-current" />
        ) : null}
        {buttonText}
      </Button>
    </form>
  );
}
