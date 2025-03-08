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
          window.history.replaceState(null, '', newUrl);
          onClose();
        }
      }}
    >
      <div className="w-full flex flex-col items-center justify-center">
        <DialogContent className="fixed bg-background max-h-[85vh] overflow-hidden rounded-xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="mb-2">Settings</DialogTitle>
            <hr className="m-0 border-border" />
          </DialogHeader>
          <div className="w-full overflow-y-auto max-h-[calc(85vh-120px)]">
            {content}
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default SettingsDialog;
