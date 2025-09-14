import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";

const CustomDialog = ({ isOpen, onOpenChange, title, children, onConfirm, confirmText = "Confirm", cancelText = "Cancel", isLoading = false }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="text-white">{children}</div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)} // Explicitly set to false to close
            className="text-gray-300 border-gray-500 hover:bg-gray-700/50"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;