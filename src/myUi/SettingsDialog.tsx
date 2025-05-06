"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: React.ReactNode;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  content,
}) => {
  const router = useRouter();

  useEffect(() => {
    if (isOpen && window.location.hash !== "#settings") {
      window.location.hash = "settings";
    }

    const handleHashChange = () => {
      if (window.location.hash !== "#settings" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [isOpen, onClose]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          const newUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, "", newUrl);
          onClose();
        }
      }}
    >
      <DialogContent
        className="fixed bg-background rounded-2xl p-0 flex flex-col 
        w-[95%] sm:w-[85%] md:w-[75%] lg:w-[65%] xl:w-[55%]  
        max-w-[800px] h-[70vh] sm:h-[75vh] md:h-[80vh]
        translate-x-[-50%] translate-y-[-50%] left-1/2 top-1/2 
        shadow-md border border-gray-200 dark:border-gray-800
        overflow-hidden"
      >
        {/* Minimal header with just a divider */}
        <DialogHeader className="border-b border-gray-200 dark:border-gray-800 p-0"></DialogHeader>

        {/* Main content must scroll instead of resizing the modal */}
        <div className="flex-1 overflow-y-auto px-6 pt-6">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
