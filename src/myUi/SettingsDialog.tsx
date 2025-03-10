"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

  // Handle URL hash when dialog opens/closes
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
          // Remove the hash using the URL API
          const newUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, "", newUrl);
          onClose();
        }
      }}
    >
      {/* <div className="w-full flex flex-col"> */}
      <DialogContent
        className="fixed bg-background rounded-xl p-0 flex flex-col 
             w-[90%] sm:w-[80%] md:w-[60%] lg:w-[50%] xl:w-[40%] 
             max-w-[500px] h-[85vh] sm:h-[80vh] md:h-[75vh] 
             translate-x-[-50%] translate-y-[-50%] left-1/2 top-1/2 
             overflow-hidden shadow-lg"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="mb-2">Settings</DialogTitle>
          <hr className="m-0 border-border" />
        </DialogHeader>

        {/* Content area should take full height */}
        <div className="flex-1 overflow-auto p-6">{content}</div>
      </DialogContent>

      {/* </div> */}
    </Dialog>
  );
};

export default SettingsDialog;
