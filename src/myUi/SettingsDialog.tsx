"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
