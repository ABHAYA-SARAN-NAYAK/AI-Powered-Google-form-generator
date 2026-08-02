import React from 'react';
import Button from '../../../components/ui/Button';

const BulkActionsBar = ({ selectedCount, onExport, onArchive, onShare, onDelete, onClearSelection, busy = false }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 w-[calc(100%-2rem)] max-w-4xl animate-slide-in">
      <div className="bg-[#111827]/95 backdrop-blur-xl border border-indigo-500/30 text-white rounded-2xl shadow-2xl p-4 lg:p-5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl flex items-center justify-center font-bold text-sm">
              <span>{selectedCount}</span>
            </div>
            <span className="font-semibold text-sm lg:text-base text-white">
              {selectedCount} form{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
              disabled={busy}
              iconName="Download"
              iconPosition="left"
              iconSize={15}
              className="flex-1 lg:flex-initial text-xs"
            >
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onArchive}
              disabled={busy}
              iconName="Archive"
              iconPosition="left"
              iconSize={15}
              className="flex-1 lg:flex-initial text-xs"
            >
              Archive
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onShare}
              disabled={busy}
              iconName="Share2"
              iconPosition="left"
              iconSize={15}
              className="flex-1 lg:flex-initial text-xs"
            >
              Share
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={busy}
              iconName="Trash2"
              iconPosition="left"
              iconSize={15}
              className="flex-1 lg:flex-initial text-xs"
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              disabled={busy}
              iconName="X"
              iconSize={18}
              className="text-gray-400 hover:text-white hover:bg-white/10"
              aria-label="Clear selection"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;